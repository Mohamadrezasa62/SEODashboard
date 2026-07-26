from rest_framework import serializers
from .models import FeedbackThread, FeedbackComment, FeedbackAttachment, FeedbackMention
from apps.users.serializers import UserListSerializer


class FeedbackAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackAttachment
        fields = ('id', 'file', 'file_name', 'file_size', 'file_type', 'created_at')
        read_only_fields = ('id', 'created_at')


class FeedbackMentionSerializer(serializers.ModelSerializer):
    mentioned_user = UserListSerializer(read_only=True)

    class Meta:
        model = FeedbackMention
        fields = ('id', 'mentioned_user', 'is_seen')


class FeedbackCommentSerializer(serializers.ModelSerializer):
    author = UserListSerializer(read_only=True)
    attachments = FeedbackAttachmentSerializer(many=True, read_only=True)
    mentions = FeedbackMentionSerializer(many=True, read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = FeedbackComment
        fields = (
            'id', 'content', 'author', 'parent',
            'is_edited', 'edited_at',
            'attachments', 'mentions',
            'replies', 'reply_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'author', 'is_edited', 'edited_at', 'created_at', 'updated_at')

    def get_replies(self, obj):
        if obj.parent is not None:
            return []
        replies = obj.replies.filter(deleted_at__isnull=True).order_by('created_at')
        return FeedbackCommentSerializer(replies, many=True).data

    def get_reply_count(self, obj):
        return obj.replies.filter(deleted_at__isnull=True).count()


class FeedbackThreadSerializer(serializers.ModelSerializer):
    created_by = UserListSerializer(read_only=True)
    assigned_to = UserListSerializer(read_only=True)
    resolved_by = UserListSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    has_unseen = serializers.SerializerMethodField()

    class Meta:
        model = FeedbackThread
        fields = (
            'id', 'title', 'status', 'priority',
            'created_by', 'assigned_to', 'resolved_by',
            'resolved_at', 'comment_count', 'has_unseen',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'created_by', 'resolved_by', 'resolved_at',
            'created_at', 'updated_at',
        )

    def get_comment_count(self, obj):
        return obj.comments.filter(deleted_at__isnull=True).count()

    def get_has_unseen(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        from apps.feedback.repositories import FeedbackSeenRepository
        return FeedbackSeenRepository.has_unseen(obj, request.user)


class CreateThreadSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'critical'],
        default='medium',
    )


class UpdateThreadSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, required=False)
    status = serializers.ChoiceField(
        choices=['open', 'in_progress', 'resolved', 'closed'],
        required=False,
    )
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'critical'],
        required=False,
    )


class AssignThreadSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class CreateCommentSerializer(serializers.Serializer):
    content = serializers.CharField()
    parent_id = serializers.UUIDField(required=False, allow_null=True)


class UpdateCommentSerializer(serializers.Serializer):
    content = serializers.CharField()


class FeedbackFilterSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['open', 'in_progress', 'resolved', 'closed'],
        required=False,
    )
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'critical'],
        required=False,
    )
    search = serializers.CharField(required=False)
    assigned_to = serializers.UUIDField(required=False)
    created_by = serializers.UUIDField(required=False)