from datetime import date, timedelta
from apps.core.exceptions import NotFoundException, PermissionDeniedException
from apps.projects.repositories import ProjectRepository, ProjectMemberRepository
from .repositories import SEORepository


class SEOService:
    def _get_project_and_check_access(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        if not ProjectMemberRepository.is_member(project, user):
            raise PermissionDeniedException('Access denied.')
        return project

    def _parse_date_range(self, date_from_str, date_to_str):
        if date_to_str:
            date_to = date.fromisoformat(date_to_str)
        else:
            date_to = date.today() - timedelta(days=1)
        if date_from_str:
            date_from = date.fromisoformat(date_from_str)
        else:
            date_from = date_to - timedelta(days=28)
        return date_from, date_to

    def get_summary(self, project_id, user, date_from_str=None, date_to_str=None):
        project = self._get_project_and_check_access(project_id, user)
        date_from, date_to = self._parse_date_range(date_from_str, date_to_str)
        return SEORepository.get_summary(project, date_from, date_to)

    def get_top_keywords(self, project_id, user, date_from_str=None, date_to_str=None, limit=50, order_by='clicks'):
        project = self._get_project_and_check_access(project_id, user)
        date_from, date_to = self._parse_date_range(date_from_str, date_to_str)
        return SEORepository.get_top_keywords(project, date_from, date_to, limit, order_by)

    def get_top_pages(self, project_id, user, date_from_str=None, date_to_str=None, limit=50, order_by='clicks'):
        project = self._get_project_and_check_access(project_id, user)
        date_from, date_to = self._parse_date_range(date_from_str, date_to_str)
        return SEORepository.get_top_pages(project, date_from, date_to, limit, order_by)

    def get_daily_trend(self, project_id, user, date_from_str=None, date_to_str=None):
        project = self._get_project_and_check_access(project_id, user)
        date_from, date_to = self._parse_date_range(date_from_str, date_to_str)
        return list(SEORepository.get_daily_trend(project, date_from, date_to))

    def get_device_breakdown(self, project_id, user, date_from_str=None, date_to_str=None):
        project = self._get_project_and_check_access(project_id, user)
        date_from, date_to = self._parse_date_range(date_from_str, date_to_str)
        return list(SEORepository.get_device_breakdown(project, date_from, date_to))

    def get_country_breakdown(self, project_id, user, date_from_str=None, date_to_str=None, limit=20):
        project = self._get_project_and_check_access(project_id, user)
        date_from, date_to = self._parse_date_range(date_from_str, date_to_str)
        return list(SEORepository.get_country_breakdown(project, date_from, date_to, limit))

    def get_data_points(self, project_id, user, filters=None):
        project = self._get_project_and_check_access(project_id, user)
        return SEORepository.get_data_points(project, filters)