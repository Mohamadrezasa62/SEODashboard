from .models import Dashboard, Widget
from apps.users.models import User
from apps.projects.models import Project


class DashboardRepository:
    @staticmethod
    def get_by_id(dashboard_id):
        try:
            return Dashboard.objects.get(id=dashboard_id)
        except Dashboard.DoesNotExist:
            return None

    @staticmethod
    def get_user_dashboards(user, project=None):
        qs = Dashboard.objects.filter(owner=user).order_by('-is_default', '-created_at')
        if project:
            qs = qs.filter(project=project)
        return qs

    @staticmethod
    def get_shared_dashboards(project):
        return Dashboard.objects.filter(project=project, is_shared=True).order_by('-created_at')

    @staticmethod
    def get_default(user, project=None):
        qs = Dashboard.objects.filter(owner=user, is_default=True)
        if project:
            qs = qs.filter(project=project)
        return qs.first()

    @staticmethod
    def create(name, owner, project=None, is_default=False, is_shared=False, layout=None):
        return Dashboard.objects.create(
            name=name,
            owner=owner,
            project=project,
            is_default=is_default,
            is_shared=is_shared,
            layout=layout or [],
        )

    @staticmethod
    def update(dashboard, **kwargs):
        for key, value in kwargs.items():
            setattr(dashboard, key, value)
        dashboard.save()
        return dashboard

    @staticmethod
    def delete(dashboard):
        dashboard.delete()

    @staticmethod
    def set_default(dashboard, user):
        Dashboard.objects.filter(owner=user, is_default=True).update(is_default=False)
        dashboard.is_default = True
        dashboard.save(update_fields=['is_default'])
        return dashboard


class WidgetRepository:
    @staticmethod
    def get_by_id(widget_id):
        try:
            return Widget.objects.get(id=widget_id)
        except Widget.DoesNotExist:
            return None

    @staticmethod
    def get_dashboard_widgets(dashboard):
        return Widget.objects.filter(dashboard=dashboard).order_by('position_y', 'position_x')

    @staticmethod
    def create(dashboard, name, widget_type, data_source, config=None,
               filters=None, position_x=0, position_y=0, width=6, height=4):
        return Widget.objects.create(
            dashboard=dashboard,
            name=name,
            widget_type=widget_type,
            data_source=data_source,
            config=config or {},
            filters=filters or {},
            position_x=position_x,
            position_y=position_y,
            width=width,
            height=height,
        )

    @staticmethod
    def update(widget, **kwargs):
        for key, value in kwargs.items():
            setattr(widget, key, value)
        widget.save()
        return widget

    @staticmethod
    def delete(widget):
        widget.delete()

    @staticmethod
    def bulk_update_positions(widgets_data):
        for item in widgets_data:
            Widget.objects.filter(id=item['id']).update(
                position_x=item.get('position_x', 0),
                position_y=item.get('position_y', 0),
                width=item.get('width', 6),
                height=item.get('height', 4),
            )