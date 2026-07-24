import uuid
from django.db import models
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.users.models import User
from apps.projects.models import Project


class FeedbackThread(TimeStampedModel, SoftDeleteModel):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='feedback_threads')
    title = models.CharField(max_length=500)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_threads')
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_threads'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_threads'
    )

    class Meta:
        db_table = 'feedback_threads'
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['created_by', 'status']),
        ]

    def __str__(self):
        return self.title


class FeedbackComment(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(FeedbackThread, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedback_comments')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies'
    )
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'feedback_comments'
        indexes = [
            models.Index(fields=['thread', 'parent']),
            models.Index(fields=['author']),
        ]

    def __str__(self):
        return f'Comment by {self.author.email} on {self.thread.title}'


class FeedbackMention(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comment = models.ForeignKey(FeedbackComment, on_delete=models.CASCADE, related_name='mentions')
    mentioned_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentions_received')
    is_seen = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = 'feedback_mentions'
        unique_together = ('comment', 'mentioned_user')


class FeedbackAttachment(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comment = models.ForeignKey(FeedbackComment, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_attachments')
    file = models.FileField(upload_to='feedback_attachments/')
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    file_type = models.CharField(max_length=100)

    class Meta:
        db_table = 'feedback_attachments'


class FeedbackSeen(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(FeedbackThread, on_delete=models.CASCADE, related_name='seen_by')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seen_threads')
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'feedback_seen'
        unique_together = ('thread', 'user')