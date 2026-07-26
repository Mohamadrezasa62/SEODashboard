from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.core.mixins import ResponseMixin
from .serializers import (
    FeedbackThreadSerializer, CreateThreadSerializer,
    UpdateThreadSerializer, AssignThreadSerializer,
    FeedbackCommentSerializer, CreateCommentSerializer,
    UpdateCommentSerializer, FeedbackFilterSerializer,
)
from .services import FeedbackService


class FeedbackThreadListView(ResponseMixin, APIView):
    def get(self, request, project_id):
        filter_serializer = FeedbackFilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)
        service = FeedbackService()
        threads = service.list_threads(project_id, request.user, filter_serializer.validated_data)
        serializer = FeedbackThreadSerializer(
            threads, many=True, context={'request': request}
        )
        return self.success_response(data=serializer.data)

    def post(self, request, project_id):
        serializer = CreateThreadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = FeedbackService()
        thread = service.create_thread(
            project_id=project_id,
            title=serializer.validated_data['title'],
            priority=serializer.validated_data.get('priority', 'medium'),
            user=request.user,
        )
        return self.success_response(
            data=FeedbackThreadSerializer(thread, context={'request': request}).data,
            message='Thread created successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class FeedbackThreadDetailView(ResponseMixin, APIView):
    def get(self, request, thread_id):
        service = FeedbackService()
        thread = service.get_thread(thread_id, request.user)
        return self.success_response(
            data=FeedbackThreadSerializer(thread, context={'request': request}).data
        )

    def patch(self, request, thread_id):
        serializer = UpdateThreadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = FeedbackService()
        thread = service.update_thread(thread_id, request.user, serializer.validated_data)
        return self.success_response(
            data=FeedbackThreadSerializer(thread, context={'request': request}).data,
            message='Thread updated.',
        )

    def delete(self, request, thread_id):
        service = FeedbackService()
        service.delete_thread(thread_id, request.user)
        return self.success_response(message='Thread deleted.')


class FeedbackThreadResolveView(ResponseMixin, APIView):
    def post(self, request, thread_id):
        service = FeedbackService()
        thread = service.resolve_thread(thread_id, request.user)
        return self.success_response(
            data=FeedbackThreadSerializer(thread, context={'request': request}).data,
            message='Thread resolved.',
        )


class FeedbackThreadAssignView(ResponseMixin, APIView):
    def post(self, request, thread_id):
        serializer = AssignThreadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = FeedbackService()
        thread = service.assign_thread(
            thread_id=thread_id,
            assignee_id=serializer.validated_data['user_id'],
            user=request.user,
        )
        return self.success_response(
            data=FeedbackThreadSerializer(thread, context={'request': request}).data,
            message='Thread assigned.',
        )


class FeedbackThreadSeenView(ResponseMixin, APIView):
    def post(self, request, thread_id):
        service = FeedbackService()
        service.mark_seen(thread_id, request.user)
        return self.success_response(message='Marked as seen.')


class FeedbackCommentListView(ResponseMixin, APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, thread_id):
        service = FeedbackService()
        comments = service.get_comments(thread_id, request.user)
        serializer = FeedbackCommentSerializer(comments, many=True)
        return self.success_response(data=serializer.data)

    def post(self, request, thread_id):
        serializer = CreateCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        files = request.FILES.getlist('attachments')
        service = FeedbackService()
        comment = service.add_comment(
            thread_id=thread_id,
            content=serializer.validated_data['content'],
            user=request.user,
            parent_id=serializer.validated_data.get('parent_id'),
            files=files if files else None,
        )
        return self.success_response(
            data=FeedbackCommentSerializer(comment).data,
            message='Comment added.',
            status_code=status.HTTP_201_CREATED,
        )


class FeedbackCommentDetailView(ResponseMixin, APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, comment_id):
        serializer = UpdateCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = FeedbackService()
        comment = service.update_comment(
            comment_id=comment_id,
            content=serializer.validated_data['content'],
            user=request.user,
        )
        return self.success_response(
            data=FeedbackCommentSerializer(comment).data,
            message='Comment updated.',
        )

    def delete(self, request, comment_id):
        service = FeedbackService()
        service.delete_comment(comment_id, request.user)
        return self.success_response(message='Comment deleted.')