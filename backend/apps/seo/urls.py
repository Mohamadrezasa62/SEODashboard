from django.urls import path
from .views import (
    SEOSummaryView, SEOTopKeywordsView, SEOTopPagesView,
    SEODailyTrendView, SEODeviceBreakdownView, SEOCountryBreakdownView,
    SEODataPointsView,
)

urlpatterns = [
    path('<uuid:project_id>/summary/', SEOSummaryView.as_view(), name='seo-summary'),
    path('<uuid:project_id>/keywords/', SEOTopKeywordsView.as_view(), name='seo-keywords'),
    path('<uuid:project_id>/pages/', SEOTopPagesView.as_view(), name='seo-pages'),
    path('<uuid:project_id>/trend/', SEODailyTrendView.as_view(), name='seo-trend'),
    path('<uuid:project_id>/devices/', SEODeviceBreakdownView.as_view(), name='seo-devices'),
    path('<uuid:project_id>/countries/', SEOCountryBreakdownView.as_view(), name='seo-countries'),
    path('<uuid:project_id>/data/', SEODataPointsView.as_view(), name='seo-data'),
]