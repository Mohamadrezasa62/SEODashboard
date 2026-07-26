import uuid
from django.db import models
from apps.core.models import TimeStampedModel
from apps.users.models import User
from apps.projects.models import Project


class AIProvider(TimeStampedModel):
    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('anthropic', 'Anthropic'),
        ('gemini', 'Google Gemini'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, db_index=True)
    model = models.CharField(max_length=100)
    api_key_encrypted = models.TextField()
    is_active = models.BooleanField(default=False, db_index=True)
    is_default = models.BooleanField(default=False, db_index=True)
    config = models.JSONField(default=dict)

    class Meta:
        db_table = 'ai_providers'

    def __str__(self):
        return f'{self.name} ({self.provider})'


class AIPromptTemplate(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    system_prompt = models.TextField()
    user_prompt_template = models.TextField()
    provider = models.ForeignKey(
        AIProvider, on_delete=models.SET_NULL, null=True, related_name='templates'
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = 'ai_prompt_templates'

    def __str__(self):
        return self.name


class AIUsageLog(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_usage_logs')
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, null=True, blank=True, related_name='ai_usage_logs'
    )
    provider = models.ForeignKey(AIProvider, on_delete=models.SET_NULL, null=True)
    template = models.ForeignKey(AIPromptTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    total_tokens = models.PositiveIntegerField(default=0)
    cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    response_time_ms = models.PositiveIntegerField(default=0)
    is_success = models.BooleanField(default=True, db_index=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'ai_usage_logs'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['project', 'created_at']),
        ]



from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator


class Report(models.Model):
    FORMAT_CHOICES = (
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    name = models.CharField(
        max_length=255
    )

    format = models.CharField(
        max_length=10,
        choices=FORMAT_CHOICES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    config = models.JSONField(
        default=dict,
        blank=True
    )

    date_from = models.DateField(
        null=True,
        blank=True
    )

    date_to = models.DateField(
        null=True,
        blank=True
    )

    file = models.FileField(
        upload_to='reports/%Y/%m/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'xlsx', 'xls', 'csv']
            )
        ],
        null=True,
        blank=True
    )

    file_size = models.PositiveBigIntegerField(
        null=True,
        blank=True
    )

    generated_at = models.DateTimeField(
        null=True,
        blank=True
    )

    error_message = models.TextField(
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='ai_reports',
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
        ]


    def __str__(self):
        return self.name



class ScheduledReport(models.Model):

    FREQUENCY_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    )

    FORMAT_CHOICES = (
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
    )


    name = models.CharField(
        max_length=255
    )

    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES
    )

    format = models.CharField(
        max_length=10,
        choices=FORMAT_CHOICES
    )

    config = models.JSONField(
        default=dict,
        blank=True
    )

    recipients = models.JSONField(
        default=list
    )

    is_active = models.BooleanField(
        default=True
    )

    next_run_at = models.DateTimeField(
        null=True,
        blank=True
    )

    last_run_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='ai_scheduled_reports',
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['next_run_at']),
        ]


    def __str__(self):
        return self.name