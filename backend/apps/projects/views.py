from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.core.mixins import ResponseMixin
from apps.core.permissions import IsCompanyManager
from .serializers import (
    ProjectSerializer, ProjectListSerializer,
    CreateProjectSerializer, UpdateProjectSerializer,
    AddMemberSerializer, UpdateMemberRoleSerializer,
    ProjectMemberSerializer,
)
from .services import ProjectService


class ProjectListView(ResponseMixin, APIView):
    def get(self, request):
        service = ProjectService()
        search = request.query_params.get('search')
        status_filter = request.query_params.get('status')
        projects = service.list_projects(request.user, search=search, status=status_filter)
        serializer = ProjectListSerializer(projects, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request):
        serializer = CreateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProjectService()
        project = service.create_project(
            name=serializer.validated_data['name'],
            domain=serializer.validated_data['domain'],
            description=serializer.validated_data.get('description'),
            owner=request.user,
        )
        return self.success_response(
            data=ProjectSerializer(project).data,
            message='Project created successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class ProjectDetailView(ResponseMixin, APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, project_id):
        service = ProjectService()
        project = service.get_project(project_id, request.user)
        return self.success_response(data=ProjectSerializer(project).data)

    def patch(self, request, project_id):
        serializer = UpdateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProjectService()
        project = service.update_project(project_id, request.user, serializer.validated_data)
        return self.success_response(
            data=ProjectSerializer(project).data,
            message='Project updated successfully.',
        )

    def delete(self, request, project_id):
        service = ProjectService()
        service.delete_project(project_id, request.user)
        return self.success_response(message='Project deleted successfully.')


class ProjectArchiveView(ResponseMixin, APIView):
    def post(self, request, project_id):
        service = ProjectService()
        project = service.archive_project(project_id, request.user)
        return self.success_response(
            data=ProjectSerializer(project).data,
            message='Project archived.',
        )


class ProjectMembersView(ResponseMixin, APIView):
    def get(self, request, project_id):
        service = ProjectService()
        members = service.get_members(project_id, request.user)
        serializer = ProjectMemberSerializer(members, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request, project_id):
        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProjectService()
        member = service.add_member(
            project_id=project_id,
            user_id=serializer.validated_data['user_id'],
            role=serializer.validated_data['role'],
            requesting_user=request.user,
        )
        return self.success_response(
            data=ProjectMemberSerializer(member).data,
            message='Member added successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class ProjectMemberDetailView(ResponseMixin, APIView):
    def patch(self, request, project_id, user_id):
        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProjectService()
        member = service.update_member_role(
            project_id=project_id,
            user_id=user_id,
            new_role=serializer.validated_data['role'],
            requesting_user=request.user,
        )
        return self.success_response(
            data=ProjectMemberSerializer(member).data,
            message='Member role updated.',
        )

    def delete(self, request, project_id, user_id):
        service = ProjectService()
        service.remove_member(project_id, user_id, request.user)
        return self.success_response(message='Member removed successfully.')