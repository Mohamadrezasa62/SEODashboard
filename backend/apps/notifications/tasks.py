import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_notification_task(self, recipient_email, recipient_name, title, body, action_url=''):
    try:
        message = f'Hi {recipient_name},\n\n{body}'
        if action_url:
            message += f'\n\nView: {action_url}'
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        logger.info('Email notification sent to %s', recipient_email)
    except Exception as exc:
        logger.error('Failed to send notification email to %s: %s', recipient_email, exc)
        raise self.retry(exc=exc)