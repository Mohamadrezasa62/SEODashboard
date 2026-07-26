from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from .serializers import (
    DashboardSerializer, DashboardListSerializer,
    CreateDashboardSerializer, UpdateDashboardSerializer,
    WidgetSerializer, CreateWidgetSerializer, UpdateWidgetSerializer,
    UpdateLayoutSerializer,
)
from .services import DashboardService


class DashboardListView(ResponseMixin, APIView):
    def get(self, request):
        project_id = request.query_params.get('project_id')
        service = DashboardService()
        dashboards = service.list_dashboards(request.user, project_id)
        serializer = DashboardListSerializer(dashboards, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateDashboardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = DashboardService()
        dashboard = service.create_dashboard(
            user=request.user,
            **serializer.validated_data,
        )
        return self.success_response(
            data=DashboardSerializer(dashboard).data,
            message='Dashboard created.',
            status_code=status.HTTP_201_CREATED,
        )


class DashboardDetailView(ResponseMixin, APIView):
    def get(self, request, dashboard_id):
        service = DashboardService()
        dashboard = service.get_dashboard(dashboard_id, request.user)
        return self.success_response(data=DashboardSerializer(dashboard).data)

    def patch(self, request, dashboard_id):
        serializer = UpdateDashboardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = DashboardService()
        dashboard = service.update_dashboard(dashboard_id, request.user, serializer.validated_data)
        return self.success_response(
            data=DashboardSerializer(dashboard).data,
            message='Dashboard updated.',
        )

    def delete(self, request, dashboard_id):
        service = DashboardService()
        service.delete_dashboard(dashboard_id, request.user)
        return self.success_response(message='Dashboard deleted.')


class DashboardSetDefaultView(ResponseMixin, APIView):
    def post(self, request, dashboard_id):
        service = DashboardService()
        dashboard = service.set_default(dashboard_id, request.user)
        return self.success_response(
            data=DashboardListSerializer(dashboard).data,
            message='Default dashboard set.',
        )


class DashboardLayoutView(ResponseMixin, APIView):
    def put(self, request, dashboard_id):
        serializer = UpdateLayoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = DashboardService()
        dashboard = service.update_layout(
            dashboard_id=dashboard_id,
            user=request.user,
            widgets_positions=[
                {
                    'id': str(w['id']),
                    'position_x': w['position_x'],
                    'position_y': w['position_y'],
                    'width': w['width'],
                    'height': w['height'],
                }
                for w in serializer.validated_data['widgets']
            ],
        )
        return self.success_response(message='Layout updated.')


class WidgetListView(ResponseMixin, APIView):
    def get(self, request, dashboard_id):
        service = DashboardService()
        widgets = service.get_widgets(dashboard_id, request.user)
        serializer = WidgetSerializer(widgets, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request, dashboard_id):
        serializer = CreateWidgetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = DashboardService()
        widget = service.add_widget(
            dashboard_id=dashboard_id,
            user=request.user,
            **serializer.validated_data,
        )
        return self.success_response(
            data=WidgetSerializer(widget).data,
            message='Widget added.',
            status_code=status.HTTP_201_CREATED,
        )


class WidgetDetailView(ResponseMixin, APIView):
    def patch(self, request, widget_id):
        serializer = UpdateWidgetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = DashboardService()
        widget = service.update_widget(widget_id, request.user, serializer.validated_data)
        return self.success_response(
            data=WidgetSerializer(widget).data,
            message='Widget updated.',
        )

    def delete(self, request, widget_id):
        service = DashboardService()
        service.delete_widget(widget_id, request.user)
        return self.success_response(message='Widget deleted.')