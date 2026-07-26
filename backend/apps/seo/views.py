from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from .serializers import (
    SEOSummarySerializer, TopKeywordSerializer, TopPageSerializer,
    DailyTrendSerializer, DeviceBreakdownSerializer, CountryBreakdownSerializer,
    SEOFilterSerializer, SEODataPointSerializer,
)
from .services import SEOService
from apps.core.pagination import StandardResultsPagination


class SEOSummaryView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        service = SEOService()
        summary = service.get_summary(
            project_id=project_id,
            user=request.user,
            date_from_str=str(serializer.validated_data['date_from']) if serializer.validated_data.get('date_from') else None,
            date_to_str=str(serializer.validated_data['date_to']) if serializer.validated_data.get('date_to') else None,
        )
        return self.success_response(data=summary)


class SEOTopKeywordsView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        service = SEOService()
        keywords = service.get_top_keywords(
            project_id=project_id,
            user=request.user,
            date_from_str=str(v['date_from']) if v.get('date_from') else None,
            date_to_str=str(v['date_to']) if v.get('date_to') else None,
            limit=v.get('limit', 50),
            order_by=v.get('order_by', 'clicks'),
        )
        return self.success_response(data=list(keywords))


class SEOTopPagesView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        service = SEOService()
        pages = service.get_top_pages(
            project_id=project_id,
            user=request.user,
            date_from_str=str(v['date_from']) if v.get('date_from') else None,
            date_to_str=str(v['date_to']) if v.get('date_to') else None,
            limit=v.get('limit', 50),
            order_by=v.get('order_by', 'clicks'),
        )
        return self.success_response(data=list(pages))


class SEODailyTrendView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        service = SEOService()
        trend = service.get_daily_trend(
            project_id=project_id,
            user=request.user,
            date_from_str=str(v['date_from']) if v.get('date_from') else None,
            date_to_str=str(v['date_to']) if v.get('date_to') else None,
        )
        return self.success_response(data=trend)


class SEODeviceBreakdownView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        service = SEOService()
        breakdown = service.get_device_breakdown(
            project_id=project_id,
            user=request.user,
            date_from_str=str(v['date_from']) if v.get('date_from') else None,
            date_to_str=str(v['date_to']) if v.get('date_to') else None,
        )
        return self.success_response(data=breakdown)


class SEOCountryBreakdownView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        service = SEOService()
        breakdown = service.get_country_breakdown(
            project_id=project_id,
            user=request.user,
            date_from_str=str(v['date_from']) if v.get('date_from') else None,
            date_to_str=str(v['date_to']) if v.get('date_to') else None,
            limit=v.get('limit', 20),
        )
        return self.success_response(data=breakdown)


class SEODataPointsView(ResponseMixin, APIView):
    def get(self, request, project_id):
        serializer = SEOFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        filters = {
            'date_from': v.get('date_from'),
            'date_to': v.get('date_to'),
            'device': v.get('device'),
            'country': v.get('country'),
            'keyword': v.get('keyword'),
            'page': v.get('page'),
        }
        service = SEOService()
        qs = service.get_data_points(project_id, request.user, filters)
        qs = qs.select_related('keyword', 'page').order_by('-date')[:200]
        serializer_out = SEODataPointSerializer(qs, many=True)
        return self.success_response(data=serializer_out.data)