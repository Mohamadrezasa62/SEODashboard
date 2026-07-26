import re
from django.utils import timezone
from apps.core.exceptions import (
    NotFoundException, PermissionDeniedException, ServiceException,
)
from apps.projects.repositories import ProjectRepository, ProjectMemberRepository
from apps.users.repositories import UserRepository, ActivityLogRepository
from .repositories import (
    FeedbackThreadRepository, FeedbackCommentRepository,
    FeedbackMentionRepository, FeedbackAttachmentRepository,
    FeedbackSeenRepository,
)


MENTION_PATTERN = re.compile(r'@\[([^\]]+)\]\(([^)]+)\)')


class FeedbackService:
    def _get_project_and_check_access(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        if not ProjectMemberRepository.is_member(project, user):
            raise PermissionDeniedException('Access denied.')
        return project

    def _get_thread_and_check_access(self, thread_id, user):
        thread = FeedbackThreadRepository.get_by_id(thread_id)
        if not thread:
            raise NotFoundException('Thread not found.')
        if not ProjectMemberRepository.is_member(thread.project, user):
            raise PermissionDeniedException('Access denied.')
        return thread

    def list_threads(self, project_id, user, filters=None):
        project = self._get_project_and_check_access(project_id, user)
        if user.role == 'employee':
            qs = FeedbackThreadRepository.get_user_threads(user, project)
        else:
            qs = FeedbackThreadRepository.get_project_threads(project, filters)
        return qs

    def get_thread(self, thread_id, user):
        thread = self._get_thread_and_check_access(thread_id, user)
        FeedbackSeenRepository.mark_seen(thread, user)
        return thread

    def create_thread(self, project_id, title, priority, user):
        project = self._get_project_and_check_access(project_id, user)
        thread = FeedbackThreadRepository.create(
            project=project,
            title=title,
            created_by=user,
            priority=priority,
        )
        ActivityLogRepository.log(
            user=user,
            action='create',
            description=f'Created feedback thread: {title}',
        )
        return thread

    def update_thread(self, thread_id, user, data):
        thread = self._get_thread_and_check_access(thread_id, user)
        if user.role == 'employee' and thread.created_by != user:
            raise PermissionDeniedException('You can only edit your own threads.')
        FeedbackThreadRepository.update(thread, **data)
        return thread

    def resolve_thread(self, thread_id, user):
        thread = self._get_thread_and_check_access(thread_id, user)
        if user.role == 'employee':
            raise PermissionDeniedException('Only managers can resolve threads.')
        FeedbackThreadRepository.resolve(thread, user)
        self._notify_thread_resolved(thread, user)
        return thread

    def delete_thread(self, thread_id, user):
        thread = self._get_thread_and_check_access(thread_id, user)
        if user.role == 'employee' and thread.created_by != user:
            raise PermissionDeniedException('You can only delete your own threads.')
        FeedbackThreadRepository.soft_delete(thread)

    def assign_thread(self, thread_id, assignee_id, user):
        thread = self._get_thread_and_check_access(thread_id, user)
        if user.role == 'employee':
            raise PermissionDeniedException('Only managers can assign threads.')
        assignee = UserRepository.get_by_id(assignee_id)
        if not assignee:
            raise NotFoundException('User not found.')
        FeedbackThreadRepository.update(thread, assigned_to=assignee)
        self._notify_assignment(thread, assignee, user)
        return thread

    def add_comment(self, thread_id, content, user, parent_id=None, files=None):
        thread = self._get_thread_and_check_access(thread_id, user)

        parent = None
        if parent_id:
            parent = FeedbackCommentRepository.get_by_id(parent_id)
            if not parent or parent.thread_id != thread.id:
                raise NotFoundException('Parent comment not found.')

        comment = FeedbackCommentRepository.create(
            thread=thread,
            author=user,
            content=content,
            parent=parent,
        )

        mentioned_user_ids = self._extract_mentions(content)
        if mentioned_user_ids:
            mentions = FeedbackMentionRepository.create_bulk(comment, mentioned_user_ids)
            self._notify_mentions(mentions, thread, user)

        if files:
            for f in files:
                FeedbackAttachmentRepository.create(
                    comment=comment,
                    uploaded_by=user,
                    file=f,
                    file_name=f.name,
                    file_size=f.size,
                    file_type=f.content_type,
                )

        self._notify_new_comment(thread, comment, user)
        return comment

    def update_comment(self, comment_id, content, user):
        comment = FeedbackCommentRepository.get_by_id(comment_id)
        if not comment:
            raise NotFoundException('Comment not found.')
        if comment.author != user and user.role not in ('developer', 'company_manager'):
            raise PermissionDeniedException('You can only edit your own comments.')
        return FeedbackCommentRepository.update(comment, content)

    def delete_comment(self, comment_id, user):
        comment = FeedbackCommentRepository.get_by_id(comment_id)
        if not comment:
            raise NotFoundException('Comment not found.')
        if comment.author != user and user.role not in ('developer', 'company_manager'):
            raise PermissionDeniedException('You can only delete your own comments.')
        FeedbackCommentRepository.soft_delete(comment)

    def get_comments(self, thread_id, user):
        thread = self._get_thread_and_check_access(thread_id, user)
        return FeedbackCommentRepository.get_thread_comments(thread)

    def mark_seen(self, thread_id, user):
        thread = self._get_thread_and_check_access(thread_id, user)
        return FeedbackSeenRepository.mark_seen(thread, user)

    def _extract_mentions(self, content):
        matches = MENTION_PATTERN.findall(content)
        return [match[1] for match in matches]

    def _notify_mentions(self, mentions, thread, sender):
        from apps.notifications.services import NotificationService
        service = NotificationService()
        for mention in mentions:
            service.create_notification(
                recipient=mention.mentioned_user,
                sender=sender,
                notification_type='mention',
                title=f'{sender.full_name} mentioned you',
                body=f'You were mentioned in thread: {thread.title}',
                action_url=f'/feedback/{thread.id}',
            )

    def _notify_new_comment(self, thread, comment, sender):
        from apps.notifications.services import NotificationService
        service = NotificationService()
        recipients = set()
        if thread.created_by != sender:
            recipients.add(thread.created_by)
        if thread.assigned_to and thread.assigned_to != sender:
            recipients.add(thread.assigned_to)
        for recipient in recipients:
            service.create_notification(
                recipient=recipient,
                sender=sender,
                notification_type='comment',
                title=f'New comment on: {thread.title}',
                body=f'{sender.full_name} commented on a thread.',
                action_url=f'/feedback/{thread.id}',
            )

    def _notify_thread_resolved(self, thread, resolver):
        from apps.notifications.services import NotificationService
        service = NotificationService()
        if thread.created_by != resolver:
            service.create_notification(
                recipient=thread.created_by,
                sender=resolver,
                notification_type='feedback_status',
                title=f'Thread resolved: {thread.title}',
                body=f'{resolver.full_name} marked your thread as resolved.',
                action_url=f'/feedback/{thread.id}',
            )

    def _notify_assignment(self, thread, assignee, assigner):
        from apps.notifications.services import NotificationService
        service = NotificationService()
        service.create_notification(
            recipient=assignee,
            sender=assigner,
            notification_type='feedback_status',
            title=f'Thread assigned to you: {thread.title}',
            body=f'{assigner.full_name} assigned a thread to you.',
            action_url=f'/feedback/{thread.id}',
        )