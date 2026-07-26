from django.utils.text import slugify
from django.utils import timezone

from apps.core.exceptions import (
    NotFoundException, ConflictException,
    ServiceException, PermissionDeniedException,
)
from apps.users.repositories import UserRepository, ActivityLogRepository
from .repositories import ProjectRepository, ProjectMemberRepository, ProjectSettingsRepository


class ProjectService:
    def get_project(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        if not ProjectMemberRepository.is_member(project, user):
            raise PermissionDeniedException('You do not have access to this project.')
        return project

    def list_projects(self, user, search=None, status=None):
        qs = ProjectRepository.search(search, user)
        if status:
            qs = qs.filter(status=status)
        return qs

    def create_project(self, name, domain, owner, description=None):
        slug = self._generate_unique_slug(name)
        project = ProjectRepository.create(
            name=name,
            slug=slug,
            domain=domain,
            owner=owner,
            description=description,
        )
        ProjectSettingsRepository.get_or_create(project)
        ProjectMemberRepository.add_member(project, owner, role='manager')
        ActivityLogRepository.log(
            user=owner,
            action='create',
            description=f'Created project: {name}',
        )
        return project

    def update_project(self, project_id, user, data):
        project = self.get_project(project_id, user)
        self._assert_manager(project, user)
        if 'name' in data:
            data['slug'] = self._generate_unique_slug(data['name'], exclude_id=project.id)
        ProjectRepository.update(project, **data)
        ActivityLogRepository.log(
            user=user,
            action='update',
            description=f'Updated project: {project.name}',
        )
        return project

    def delete_project(self, project_id, user):
        project = self.get_project(project_id, user)
        if user.role not in ('developer',) and project.owner != user:
            raise PermissionDeniedException('Only the project owner or a developer can delete this project.')
        ProjectRepository.soft_delete(project)
        ActivityLogRepository.log(
            user=user,
            action='delete',
            description=f'Deleted project: {project.name}',
        )

    def archive_project(self, project_id, user):
        project = self.get_project(project_id, user)
        self._assert_manager(project, user)
        ProjectRepository.update(project, status='archived')
        return project

    def add_member(self, project_id, user_id, role, requesting_user):
        project = self.get_project(project_id, requesting_user)
        self._assert_manager(project, requesting_user)
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')
        member, created = ProjectMemberRepository.add_member(project, user, role, requesting_user)
        if not created:
            raise ConflictException('User is already a member of this project.')
        ActivityLogRepository.log(
            user=requesting_user,
            action='update',
            description=f'Added {user.email} to project {project.name}',
        )
        return member

    def remove_member(self, project_id, user_id, requesting_user):
        project = self.get_project(project_id, requesting_user)
        self._assert_manager(project, requesting_user)
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')
        if user == project.owner:
            raise ServiceException('Cannot remove the project owner.')
        ProjectMemberRepository.remove_member(project, user)
        ActivityLogRepository.log(
            user=requesting_user,
            action='update',
            description=f'Removed {user.email} from project {project.name}',
        )

    def update_member_role(self, project_id, user_id, new_role, requesting_user):
        project = self.get_project(project_id, requesting_user)
        self._assert_manager(project, requesting_user)
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise NotFoundException('User not found.')
        ProjectMemberRepository.update_member_role(project, user, new_role)
        return ProjectMemberRepository.get_membership(project, user)

    def get_members(self, project_id, user):
        project = self.get_project(project_id, user)
        return ProjectMemberRepository.get_project_members(project)

    def _assert_manager(self, project, user):
        if user.role == 'developer':
            return
        membership = ProjectMemberRepository.get_membership(project, user)
        if not membership or membership.role not in ('manager',):
            raise PermissionDeniedException('Only project managers can perform this action.')

    def _generate_unique_slug(self, name, exclude_id=None):
        base_slug = slugify(name)
        slug = base_slug
        counter = 1
        while True:
            qs = ProjectRepository.get_all_active().filter(slug=slug)
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
            if not qs.exists():
                return slug
            slug = f'{base_slug}-{counter}'
            counter += 1