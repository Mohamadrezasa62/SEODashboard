from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_verification_email_task(self, user_email, user_name, verification_url):
    try:
        send_mail(
            subject='Verify your email — SEO Dashboard',
            message=f'Hi {user_name},\n\nPlease verify your email:\n{verification_url}\n\nThis link expires in 24 hours.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        logger.info('Verification email sent to %s', user_email)
    except Exception as exc:
        logger.error('Failed to send verification email to %s: %s', user_email, exc)
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_password_reset_email_task(self, user_email, user_name, reset_url):
    try:
        send_mail(
            subject='Password Reset — SEO Dashboard',
            message=f'Hi {user_name},\n\nReset your password:\n{reset_url}\n\nThis link expires in 1 hour.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        logger.info('Password reset email sent to %s', user_email)
    except Exception as exc:
        logger.error('Failed to send password reset email to %s: %s', user_email, exc)
        raise self.retry(exc=exc, countdown=60)