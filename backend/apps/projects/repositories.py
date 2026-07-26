from django.db.models import Q
from .models import Project, ProjectMember, ProjectSettings
from apps.users.models import User


class ProjectRepository:
    @staticmethod
    def get_by_id(project_id):
        try:
            return Project.objects.get(id=project_id, deleted_at__isnull=True)
        except Project.DoesNotExist:
            return None

    @staticmethod
    def get_by_slug(slug):
        try:
            return Project.objects.get(slug=slug, deleted_at__isnull=True)
        except Project.DoesNotExist:
            return None

    @staticmethod
    def get_all_active():
        return Project.objects.filter(deleted_at__isnull=True).order_by('-created_at')

    @staticmethod
    def get_user_projects(user):
        if user.role in ('developer', 'company_manager'):
            return Project.objects.filter(deleted_at__isnull=True).order_by('-created_at')
        return Project.objects.filter(
            deleted_at__isnull=True,
            members__user=user,
            members__is_active=True,
        ).distinct().order_by('-created_at')

    @staticmethod
    def create(name, slug, domain, owner, description=None, settings=None):
        return Project.objects.create(
            name=name,
            slug=slug,
            domain=domain,
            owner=owner,
            description=description,
            settings=settings or {},
        )

    @staticmethod
    def update(project, **kwargs):
        for key, value in kwargs.items():
            setattr(project, key, value)
        project.save()
        return project

    @staticmethod
    def soft_delete(project):
        from django.utils import timezone
        project.deleted_at = timezone.now()
        project.save(update_fields=['deleted_at'])

    @staticmethod
    def search(query, user):
        qs = ProjectRepository.get_user_projects(user)
        if query:
            qs = qs.filter(
                Q(name__icontains=query) |
                Q(domain__icontains=query) |
                Q(description__icontains=query)
            )
        return qs


class ProjectMemberRepository:
    @staticmethod
    def get_project_members(project):
        return ProjectMember.objects.filter(
            project=project, is_active=True
        ).select_related('user', 'invited_by').order_by('created_at')

    @staticmethod
    def get_membership(project, user):
        try:
            return ProjectMember.objects.get(project=project, user=user, is_active=True)
        except ProjectMember.DoesNotExist:
            return None

    @staticmethod
    def add_member(project, user, role='viewer', invited_by=None):
        member, created = ProjectMember.objects.get_or_create(
            project=project,
            user=user,
            defaults={
                'role': role,
                'invited_by': invited_by,
                'is_active': True,
            },
        )
        if not created and not member.is_active:
            member.is_active = True
            member.role = role
            member.save(update_fields=['is_active', 'role'])
        return member, created

    @staticmethod
    def remove_member(project, user):
        ProjectMember.objects.filter(project=project, user=user).update(is_active=False)

    @staticmethod
    def update_member_role(project, user, new_role):
        ProjectMember.objects.filter(project=project, user=user).update(role=new_role)

    @staticmethod
    def is_member(project, user):
        if user.role in ('developer', 'company_manager'):
            return True
        return ProjectMember.objects.filter(
            project=project, user=user, is_active=True
        ).exists()


class ProjectSettingsRepository:
    @staticmethod
    def get_or_create(project):
        settings, _ = ProjectSettings.objects.get_or_create(project=project)
        return settings

    @staticmethod
    def update(settings_obj, **kwargs):
        for key, value in kwargs.items():
            setattr(settings_obj, key, value)
        settings_obj.save()
        return settings_obj