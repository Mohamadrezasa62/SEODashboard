from django.db.models import Q, Prefetch
from django.utils import timezone
from .models import (
    FeedbackThread, FeedbackComment,
    FeedbackMention, FeedbackAttachment, FeedbackSeen,
)
from apps.users.models import User


class FeedbackThreadRepository:
    @staticmethod
    def get_by_id(thread_id):
        try:
            return FeedbackThread.objects.get(id=thread_id, deleted_at__isnull=True)
        except FeedbackThread.DoesNotExist:
            return None

    @staticmethod
    def get_project_threads(project, filters=None):
        qs = FeedbackThread.objects.filter(
            project=project,
            deleted_at__isnull=True,
        ).select_related('created_by', 'assigned_to', 'resolved_by').order_by('-created_at')

        if not filters:
            return qs

        if filters.get('status'):
            qs = qs.filter(status=filters['status'])
        if filters.get('priority'):
            qs = qs.filter(priority=filters['priority'])
        if filters.get('assigned_to'):
            qs = qs.filter(assigned_to_id=filters['assigned_to'])
        if filters.get('created_by'):
            qs = qs.filter(created_by_id=filters['created_by'])
        if filters.get('search'):
            qs = qs.filter(title__icontains=filters['search'])

        return qs

    @staticmethod
    def create(project, title, created_by, priority='medium'):
        return FeedbackThread.objects.create(
            project=project,
            title=title,
            created_by=created_by,
            priority=priority,
        )

    @staticmethod
    def update(thread, **kwargs):
        for key, value in kwargs.items():
            setattr(thread, key, value)
        thread.save()
        return thread

    @staticmethod
    def resolve(thread, resolved_by):
        thread.status = 'resolved'
        thread.resolved_at = timezone.now()
        thread.resolved_by = resolved_by
        thread.save(update_fields=['status', 'resolved_at', 'resolved_by'])
        return thread

    @staticmethod
    def soft_delete(thread):
        thread.deleted_at = timezone.now()
        thread.save(update_fields=['deleted_at'])

    @staticmethod
    def get_user_threads(user, project=None):
        qs = FeedbackThread.objects.filter(
            deleted_at__isnull=True,
        ).filter(
            Q(created_by=user) | Q(assigned_to=user)
        ).select_related('project', 'created_by')
        if project:
            qs = qs.filter(project=project)
        return qs.order_by('-created_at')


class FeedbackCommentRepository:
    @staticmethod
    def get_by_id(comment_id):
        try:
            return FeedbackComment.objects.get(id=comment_id, deleted_at__isnull=True)
        except FeedbackComment.DoesNotExist:
            return None

    @staticmethod
    def get_thread_comments(thread):
        return FeedbackComment.objects.filter(
            thread=thread,
            parent__isnull=True,
            deleted_at__isnull=True,
        ).select_related('author').prefetch_related(
            Prefetch(
                'replies',
                queryset=FeedbackComment.objects.filter(
                    deleted_at__isnull=True,
                ).select_related('author'),
            ),
            'attachments',
            'mentions__mentioned_user',
        ).order_by('created_at')

    @staticmethod
    def create(thread, author, content, parent=None):
        return FeedbackComment.objects.create(
            thread=thread,
            author=author,
            content=content,
            parent=parent,
        )

    @staticmethod
    def update(comment, content):
        comment.content = content
        comment.is_edited = True
        comment.edited_at = timezone.now()
        comment.save(update_fields=['content', 'is_edited', 'edited_at'])
        return comment

    @staticmethod
    def soft_delete(comment):
        comment.deleted_at = timezone.now()
        comment.save(update_fields=['deleted_at'])


class FeedbackMentionRepository:
    @staticmethod
    def create_bulk(comment, user_ids):
        mentions = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                obj, created = FeedbackMention.objects.get_or_create(
                    comment=comment,
                    mentioned_user=user,
                )
                if created:
                    mentions.append(obj)
            except User.DoesNotExist:
                continue
        return mentions

    @staticmethod
    def get_unread_mentions(user):
        return FeedbackMention.objects.filter(
            mentioned_user=user,
            is_seen=False,
        ).select_related('comment__thread', 'comment__author')

    @staticmethod
    def mark_seen(user):
        FeedbackMention.objects.filter(
            mentioned_user=user, is_seen=False
        ).update(is_seen=True)


class FeedbackAttachmentRepository:
    @staticmethod
    def create(comment, uploaded_by, file, file_name, file_size, file_type):
        return FeedbackAttachment.objects.create(
            comment=comment,
            uploaded_by=uploaded_by,
            file=file,
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
        )

    @staticmethod
    def get_comment_attachments(comment):
        return FeedbackAttachment.objects.filter(comment=comment)

    @staticmethod
    def delete(attachment):
        attachment.file.delete(save=False)
        attachment.delete()


class FeedbackSeenRepository:
    @staticmethod
    def mark_seen(thread, user):
        obj, _ = FeedbackSeen.objects.update_or_create(
            thread=thread,
            user=user,
            defaults={'last_seen_at': timezone.now()},
        )
        return obj

    @staticmethod
    def get_seen_users(thread):
        return FeedbackSeen.objects.filter(thread=thread).select_related('user')

    @staticmethod
    def has_unseen(thread, user):
        seen = FeedbackSeen.objects.filter(thread=thread, user=user).first()
        if not seen:
            return True
        last_comment = FeedbackComment.objects.filter(
            thread=thread, deleted_at__isnull=True
        ).order_by('-created_at').first()
        if not last_comment:
            return False
        return last_comment.created_at > seen.last_seen_at