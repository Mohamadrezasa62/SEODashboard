from apps.core.exceptions import NotFoundException, PermissionDeniedException, ServiceException
from apps.projects.repositories import ProjectRepository, ProjectMemberRepository
from .repositories import DashboardRepository, WidgetRepository


class DashboardService:
    def _check_dashboard_access(self, dashboard, user):
        if dashboard.owner == user:
            return True
        if dashboard.is_shared and dashboard.project:
            return ProjectMemberRepository.is_member(dashboard.project, user)
        if user.role in ('developer', 'company_manager'):
            return True
        raise PermissionDeniedException('Access denied to this dashboard.')

    def list_dashboards(self, user, project_id=None):
        project = None
        if project_id:
            project = ProjectRepository.get_by_id(project_id)
            if not project:
                raise NotFoundException('Project not found.')
        own = list(DashboardRepository.get_user_dashboards(user, project))
        if project:
            shared = list(DashboardRepository.get_shared_dashboards(project))
            shared = [d for d in shared if d.owner != user]
            return own + shared
        return own

    def get_dashboard(self, dashboard_id, user):
        dashboard = DashboardRepository.get_by_id(dashboard_id)
        if not dashboard:
            raise NotFoundException('Dashboard not found.')
        self._check_dashboard_access(dashboard, user)
        return dashboard

    def create_dashboard(self, user, name, project_id=None, is_default=False,
                         is_shared=False, layout=None):
        project = None
        if project_id:
            project = ProjectRepository.get_by_id(project_id)
            if not project:
                raise NotFoundException('Project not found.')
            if not ProjectMemberRepository.is_member(project, user):
                raise PermissionDeniedException('Access denied.')

        if is_default:
            DashboardRepository.set_default.__func__ if False else None

        dashboard = DashboardRepository.create(
            name=name,
            owner=user,
            project=project,
            is_default=is_default,
            is_shared=is_shared,
            layout=layout or [],
        )
        if is_default:
            DashboardRepository.set_default(dashboard, user)
        return dashboard

    def update_dashboard(self, dashboard_id, user, data):
        dashboard = self.get_dashboard(dashboard_id, user)
        if dashboard.owner != user and user.role != 'developer':
            raise PermissionDeniedException('Only the owner can edit this dashboard.')
        if data.get('is_default'):
            DashboardRepository.set_default(dashboard, user)
            data.pop('is_default')
        return DashboardRepository.update(dashboard, **data)

    def delete_dashboard(self, dashboard_id, user):
        dashboard = self.get_dashboard(dashboard_id, user)
        if dashboard.owner != user and user.role != 'developer':
            raise PermissionDeniedException('Only the owner can delete this dashboard.')
        DashboardRepository.delete(dashboard)

    def set_default(self, dashboard_id, user):
        dashboard = self.get_dashboard(dashboard_id, user)
        if dashboard.owner != user:
            raise PermissionDeniedException('Only the owner can set default.')
        return DashboardRepository.set_default(dashboard, user)

    def add_widget(self, dashboard_id, user, name, widget_type, data_source,
                   config=None, filters=None, position_x=0, position_y=0,
                   width=6, height=4):
        dashboard = self.get_dashboard(dashboard_id, user)
        if dashboard.owner != user and user.role != 'developer':
            raise PermissionDeniedException('Only the owner can add widgets.')
        return WidgetRepository.create(
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

    def update_widget(self, widget_id, user, data):
        widget = WidgetRepository.get_by_id(widget_id)
        if not widget:
            raise NotFoundException('Widget not found.')
        self._check_dashboard_access(widget.dashboard, user)
        if widget.dashboard.owner != user and user.role != 'developer':
            raise PermissionDeniedException('Only the owner can edit widgets.')
        return WidgetRepository.update(widget, **data)

    def delete_widget(self, widget_id, user):
        widget = WidgetRepository.get_by_id(widget_id)
        if not widget:
            raise NotFoundException('Widget not found.')
        self._check_dashboard_access(widget.dashboard, user)
        if widget.dashboard.owner != user and user.role != 'developer':
            raise PermissionDeniedException('Only the owner can delete widgets.')
        WidgetRepository.delete(widget)

    def get_widgets(self, dashboard_id, user):
        dashboard = self.get_dashboard(dashboard_id, user)
        return WidgetRepository.get_dashboard_widgets(dashboard)

    def update_layout(self, dashboard_id, user, widgets_positions):
        dashboard = self.get_dashboard(dashboard_id, user)
        if dashboard.owner != user and user.role != 'developer':
            raise PermissionDeniedException('Only the owner can update layout.')
        WidgetRepository.bulk_update_positions(widgets_positions)
        return DashboardRepository.update(dashboard, layout=widgets_positions)