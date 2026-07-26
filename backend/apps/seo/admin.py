from django.contrib import admin
from .models import SEOKeyword, SEOPage, SEODataPoint, SEODailySummary


@admin.register(SEOKeyword)
class SEOKeywordAdmin(admin.ModelAdmin):
    list_display = ('keyword', 'project', 'created_at')
    search_fields = ('keyword', 'project__name')
    list_filter = ('project',)


@admin.register(SEOPage)
class SEOPageAdmin(admin.ModelAdmin):
    list_display = ('url', 'project', 'created_at')
    search_fields = ('url', 'project__name')


@admin.register(SEODataPoint)
class SEODataPointAdmin(admin.ModelAdmin):
    list_display = ('project', 'date', 'clicks', 'impressions', 'ctr', 'position', 'device')
    list_filter = ('project', 'device', 'date')
    search_fields = ('project__name', 'keyword__keyword', 'page__url')
    readonly_fields = ('created_at',)


@admin.register(SEODailySummary)
class SEODailySummaryAdmin(admin.ModelAdmin):
    list_display = ('project', 'date', 'total_clicks', 'total_impressions', 'avg_position')
    list_filter = ('project',)