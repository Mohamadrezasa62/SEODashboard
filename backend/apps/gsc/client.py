import logging
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.utils import timezone

logger = logging.getLogger(__name__)


class GSCClient:
    SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
    SERVICE_NAME = 'webmasters'
    SERVICE_VERSION = 'v3'

    def __init__(self, credential_obj):
        self.credential_obj = credential_obj
        self.service = None

    def _build_service(self):
        from django.conf import settings
        creds = Credentials(
            token=self.credential_obj.access_token,
            refresh_token=self.credential_obj.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            client_secret=settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            self.credential_obj.access_token = creds.token
            self.credential_obj.token_expiry = timezone.now() + timezone.timedelta(seconds=3600)
            self.credential_obj.save(update_fields=['access_token', 'token_expiry'])

        self.service = build(self.SERVICE_NAME, self.SERVICE_VERSION, credentials=creds)
        return self.service

    def get_sites(self):
        service = self._build_service()
        try:
            result = service.sites().list().execute()
            return result.get('siteEntry', [])
        except HttpError as e:
            logger.error('GSC get_sites error: %s', e)
            raise

    def query_search_analytics(self, site_url, start_date, end_date, dimensions, row_limit=25000, start_row=0):
        service = self._build_service()
        try:
            request_body = {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'dimensions': dimensions,
                'rowLimit': row_limit,
                'startRow': start_row,
            }
            response = service.searchanalytics().query(
                siteUrl=site_url,
                body=request_body,
            ).execute()
            return response.get('rows', [])
        except HttpError as e:
            logger.error('GSC query error: %s', e)
            raise

    def get_all_rows(self, site_url, start_date, end_date, dimensions):
        all_rows = []
        start_row = 0
        row_limit = 25000
        while True:
            rows = self.query_search_analytics(
                site_url=site_url,
                start_date=start_date,
                end_date=end_date,
                dimensions=dimensions,
                row_limit=row_limit,
                start_row=start_row,
            )
            if not rows:
                break
            all_rows.extend(rows)
            if len(rows) < row_limit:
                break
            start_row += row_limit
        return all_rows