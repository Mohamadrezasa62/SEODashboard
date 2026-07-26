import logging
from datetime import date, timedelta
from django.utils import timezone

from apps.core.exceptions import NotFoundException, ServiceException
from apps.projects.repositories import ProjectRepository, ProjectSettingsRepository
from apps.seo.repositories import SEORepository
from .client import GSCClient
from .repositories import GSCCredentialRepository, GSCSyncLogRepository

logger = logging.getLogger(__name__)


class GSCService:
    def connect(self, project_id, user, access_token, refresh_token, token_expiry, site_url):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')

        credential, _ = GSCCredentialRepository.create_or_update(
            project=project,
            user=user,
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=token_expiry,
            site_url=site_url,
        )

        settings_obj = ProjectSettingsRepository.get_or_create(project)
        ProjectSettingsRepository.update(
            settings_obj,
            gsc_connected=True,
            gsc_site_url=site_url,
        )
        return credential

    def disconnect(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')

        credential = GSCCredentialRepository.get_by_project(project)
        if credential:
            GSCCredentialRepository.deactivate(credential)

        settings_obj = ProjectSettingsRepository.get_or_create(project)
        ProjectSettingsRepository.update(
            settings_obj,
            gsc_connected=False,
            gsc_site_url=None,
        )

    def get_available_sites(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        credential = GSCCredentialRepository.get_by_project(project)
        if not credential:
            raise ServiceException('GSC not connected for this project.')
        client = GSCClient(credential)
        return client.get_sites()

    def sync_project(self, project_id, start_date=None, end_date=None):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')

        credential = GSCCredentialRepository.get_by_project(project)
        if not credential:
            raise ServiceException('GSC not connected for this project.')

        if not end_date:
            end_date = date.today() - timedelta(days=1)
        if not start_date:
            last_sync = GSCSyncLogRepository.get_last_successful(project)
            if last_sync and last_sync.date_range_end:
                start_date = last_sync.date_range_end + timedelta(days=1)
            else:
                start_date = end_date - timedelta(days=90)

        if start_date > end_date:
            return None

        sync_log = GSCSyncLogRepository.create(project, start_date, end_date)
        GSCSyncLogRepository.mark_running(sync_log)

        try:
            client = GSCClient(credential)
            rows = client.get_all_rows(
                site_url=credential.site_url,
                start_date=start_date,
                end_date=end_date,
                dimensions=['query', 'page', 'date', 'device', 'country'],
            )

            seo_repo = SEORepository()
            count = seo_repo.bulk_upsert_data_points(project, rows)

            settings_obj = ProjectSettingsRepository.get_or_create(project)
            ProjectSettingsRepository.update(settings_obj, last_sync_at=timezone.now())

            GSCSyncLogRepository.mark_success(sync_log, rows_synced=count)
            logger.info('GSC sync complete for project %s: %d rows', project.name, count)
            return sync_log

        except Exception as e:
            GSCSyncLogRepository.mark_failed(sync_log, str(e))
            logger.error('GSC sync failed for project %s: %s', project.name, e)
            raise

    def get_sync_logs(self, project_id, user):
        project = ProjectRepository.get_by_id(project_id)
        if not project:
            raise NotFoundException('Project not found.')
        return GSCSyncLogRepository.get_project_logs(project)