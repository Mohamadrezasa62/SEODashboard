from decimal import Decimal
from django.db.models import Sum, Avg, Count, Q
from django.db import transaction
from .models import SEOKeyword, SEOPage, SEODataPoint, SEODailySummary
from apps.projects.models import Project


class SEORepository:
    @staticmethod
    def get_or_create_keyword(project, keyword):
        obj, _ = SEOKeyword.objects.get_or_create(project=project, keyword=keyword)
        return obj

    @staticmethod
    def get_or_create_page(project, url):
        obj, _ = SEOPage.objects.get_or_create(project=project, url=url)
        return obj

    @transaction.atomic
    def bulk_upsert_data_points(self, project, rows):
        count = 0
        keyword_cache = {}
        page_cache = {}

        for row in rows:
            keys = row.get('keys', [])
            if len(keys) < 5:
                continue

            query, page_url, date_str, device, country = keys[0], keys[1], keys[2], keys[3], keys[4]
            from datetime import date as date_type
            try:
                row_date = date_type.fromisoformat(date_str)
            except ValueError:
                continue

            if query not in keyword_cache:
                keyword_cache[query] = self.get_or_create_keyword(project, query)
            if page_url not in page_cache:
                page_cache[page_url] = self.get_or_create_page(project, page_url)

            clicks = row.get('clicks', 0)
            impressions = row.get('impressions', 0)
            ctr = Decimal(str(row.get('ctr', 0)))
            position = Decimal(str(row.get('position', 0)))

            SEODataPoint.objects.update_or_create(
                project=project,
                keyword=keyword_cache[query],
                page=page_cache[page_url],
                date=row_date,
                device=device,
                country=country,
                defaults={
                    'clicks': clicks,
                    'impressions': impressions,
                    'ctr': ctr,
                    'position': position,
                },
            )
            count += 1

        return count

    @staticmethod
    def get_data_points(project, filters=None):
        qs = SEODataPoint.objects.filter(project=project)
        if not filters:
            return qs

        if filters.get('date_from'):
            qs = qs.filter(date__gte=filters['date_from'])
        if filters.get('date_to'):
            qs = qs.filter(date__lte=filters['date_to'])
        if filters.get('device'):
            qs = qs.filter(device=filters['device'])
        if filters.get('country'):
            qs = qs.filter(country=filters['country'])
        if filters.get('keyword'):
            qs = qs.filter(keyword__keyword__icontains=filters['keyword'])
        if filters.get('page'):
            qs = qs.filter(page__url__icontains=filters['page'])

        return qs

    @staticmethod
    def get_summary(project, date_from, date_to):
        qs = SEODataPoint.objects.filter(
            project=project,
            date__gte=date_from,
            date__lte=date_to,
        )
        return qs.aggregate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('position'),
            total_keywords=Count('keyword', distinct=True),
            total_pages=Count('page', distinct=True),
        )

    @staticmethod
    def get_top_keywords(project, date_from, date_to, limit=50, order_by='clicks'):
        qs = SEODataPoint.objects.filter(
            project=project,
            date__gte=date_from,
            date__lte=date_to,
        ).values('keyword__keyword').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('position'),
        ).order_by(f'-{order_by if order_by in ("total_clicks", "total_impressions") else "total_clicks"}')
        return qs[:limit]

    @staticmethod
    def get_top_pages(project, date_from, date_to, limit=50, order_by='clicks'):
        qs = SEODataPoint.objects.filter(
            project=project,
            date__gte=date_from,
            date__lte=date_to,
        ).values('page__url').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('position'),
        ).order_by(f'-{order_by if order_by in ("total_clicks", "total_impressions") else "total_clicks"}')
        return qs[:limit]

    @staticmethod
    def get_daily_trend(project, date_from, date_to):
        return SEODataPoint.objects.filter(
            project=project,
            date__gte=date_from,
            date__lte=date_to,
        ).values('date').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('position'),
        ).order_by('date')

    @staticmethod
    def get_device_breakdown(project, date_from, date_to):
        return SEODataPoint.objects.filter(
            project=project,
            date__gte=date_from,
            date__lte=date_to,
        ).values('device').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('position'),
        )

    @staticmethod
    def get_country_breakdown(project, date_from, date_to, limit=20):
        return SEODataPoint.objects.filter(
            project=project,
            date__gte=date_from,
            date__lte=date_to,
        ).values('country').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
        ).order_by('-total_clicks')[:limit]