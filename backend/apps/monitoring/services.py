from .models import AuditLog, SystemHealthLog


class MonitoringService:
    def get_audit_logs(self, user_id=None, model_name=None, action=None, limit=100):
        qs = AuditLog.objects.select_related('user').order_by('-created_at')
        if user_id:
            qs = qs.filter(user_id=user_id)
        if model_name:
            qs = qs.filter(model_name=model_name)
        if action:
            qs = qs.filter(action=action)
        return qs[:limit]

    def log_audit(self, user, action, model_name, object_id=None,
                  object_repr=None, changes=None, ip_address=None, user_agent=None):
        return AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else None,
            object_repr=object_repr,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def get_system_stats(self):
        from apps.users.models import User
        from apps.projects.models import Project
        from apps.seo.models import SEODataPoint
        from apps.feedback.models import FeedbackThread
        from django.db.models import Count

        return {
            'total_users': User.objects.filter(is_active=True).count(),
            'total_projects': Project.objects.filter(deleted_at__isnull=True).count(),
            'total_data_points': SEODataPoint.objects.count(),
            'open_feedback_threads': FeedbackThread.objects.filter(
                status='open', deleted_at__isnull=True
            ).count(),
            'users_by_role': list(
                User.objects.filter(is_active=True).values('role').annotate(count=Count('id'))
            ),
        }