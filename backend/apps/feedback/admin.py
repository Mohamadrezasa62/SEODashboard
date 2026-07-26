from django.contrib import admin
from .models import FeedbackThread, FeedbackComment, FeedbackAttachment, FeedbackMention


@admin.register(FeedbackThread)
class FeedbackThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'priority', 'created_by', 'created_at')
    list_filter = ('status', 'priority')
    search_fields = ('title', 'project__name', 'created_by__email')
    readonly_fields = ('created_at', 'updated_at', 'resolved_at')


@admin.register(FeedbackComment)
class FeedbackCommentAdmin(admin.ModelAdmin):
    list_display = ('thread', 'author', 'is_edited', 'created_at')
    search_fields = ('author__email', 'content')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(FeedbackAttachment)
class FeedbackAttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'file_type', 'file_size', 'uploaded_by', 'created_at')


@admin.register(FeedbackMention)
class FeedbackMentionAdmin(admin.ModelAdmin):
    list_display = ('comment', 'mentioned_user', 'is_seen', 'created_at')
    list_filter = ('is_seen',)