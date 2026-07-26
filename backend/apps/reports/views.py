from rest_framework import status
from rest_framework.views import APIView
from apps.core.mixins import ResponseMixin
from .serializers import (
    ReportSerializer, CreateReportSerializer,
    ScheduledReportSerializer, CreateScheduledReportSerializer,
    ToggleScheduledReportSerializer,
)
from .services import ReportService


class ReportListView(ResponseMixin, APIView):
    def get(self, request, project_id):
        service = ReportService()
        reports = service.list_reports(project_id, request.user)
        serializer = ReportSerializer(reports, many=True, context={'request': request})
        return self.success_response(data=serializer.data)

    def post(self, request, project_id):
        serializer = CreateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ReportService()
        report = service.create_report(
            project_id=project_id,
            user=request.user,
            **serializer.validated_data,
        )
        return self.success_response(
            data=ReportSerializer(report, context={'request': request}).data,
            message='Report queued for generation.',
            status_code=status.HTTP_201_CREATED,
        )


class ReportDetailView(ResponseMixin, APIView):
    def get(self, request, report_id):
        service = ReportService()
        report = service.get_report(report_id, request.user)
        return self.success_response(
            data=ReportSerializer(report, context={'request': request}).data
        )

    def delete(self, request, report_id):
        service = ReportService()
        service.delete_report(report_id, request.user)
        return self.success_response(message='Report deleted.')


class ScheduledReportListView(ResponseMixin, APIView):
    def get(self, request, project_id):
        service = ReportService()
        scheduled = service.list_scheduled_reports(project_id, request.user)
        serializer = ScheduledReportSerializer(scheduled, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request, project_id):
        serializer = CreateScheduledReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ReportService()
        scheduled = service.create_scheduled_report(
            project_id=project_id,
            user=request.user,
            **serializer.validated_data,
        )
        return self.success_response(
            data=ScheduledReportSerializer(scheduled).data,
            message='Scheduled report created.',
            status_code=status.HTTP_201_CREATED,
        )


class ScheduledReportDetailView(ResponseMixin, APIView):
    def patch(self, request, scheduled_id):
        serializer = ToggleScheduledReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ReportService()
        scheduled = service.toggle_scheduled_report(
            scheduled_id=scheduled_id,
            user=request.user,
            active=serializer.validated_data['active'],
        )
        return self.success_response(
            data=ScheduledReportSerializer(scheduled).data,
            message='Scheduled report updated.',
        )

    def delete(self, request, scheduled_id):
        service = ReportService()
        service.delete_scheduled_report(scheduled_id, request.user)
        return self.success_response(message='Scheduled report deleted.')