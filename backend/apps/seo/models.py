import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.projects.models import Project


class SEOKeyword(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='keywords')
    keyword = models.CharField(max_length=500, db_index=True)

    class Meta:
        db_table = 'seo_keywords'
        unique_together = ('project', 'keyword')
        indexes = [
            models.Index(fields=['project', 'keyword']),
        ]

    def __str__(self):
        return self.keyword


class SEOPage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='pages')
    url = models.CharField(max_length=2048, db_index=True)

    class Meta:
        db_table = 'seo_pages'
        unique_together = ('project', 'url')

    def __str__(self):
        return self.url


class SEODataPoint(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='data_points')
    keyword = models.ForeignKey(
        SEOKeyword, on_delete=models.CASCADE, null=True, blank=True, related_name='data_points'
    )
    page = models.ForeignKey(
        SEOPage, on_delete=models.CASCADE, null=True, blank=True, related_name='data_points'
    )
    date = models.DateField(db_index=True)
    clicks = models.PositiveIntegerField(default=0)
    impressions = models.PositiveIntegerField(default=0)
    ctr = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    position = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    device = models.CharField(max_length=20, default='web', db_index=True)
    country = models.CharField(max_length=10, null=True, blank=True, db_index=True)

    class Meta:
        db_table = 'seo_data_points'
        indexes = [
            models.Index(fields=['project', 'date']),
            models.Index(fields=['project', 'keyword', 'date']),
            models.Index(fields=['project', 'page', 'date']),
            models.Index(fields=['date', 'device']),
        ]

    def __str__(self):
        return f'{self.project} - {self.date}'


class SEODailySummary(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='daily_summaries')
    date = models.DateField(db_index=True)
    total_clicks = models.PositiveIntegerField(default=0)
    total_impressions = models.PositiveIntegerField(default=0)
    avg_ctr = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    avg_position = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_keywords = models.PositiveIntegerField(default=0)
    total_pages = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'seo_daily_summaries'
        unique_together = ('project', 'date')
        indexes = [
            models.Index(fields=['project', 'date']),
        ]