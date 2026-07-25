from django.core.management.base import BaseCommand
from apps.rbac.models import Permission, Role, RolePermission

PERMISSIONS = [
    # Users module
    {'codename': 'users.view', 'name': 'View Users', 'module': 'users'},
    {'codename': 'users.create', 'name': 'Create Users', 'module': 'users'},
    {'codename': 'users.edit', 'name': 'Edit Users', 'module': 'users'},
    {'codename': 'users.delete', 'name': 'Delete Users', 'module': 'users'},
    # Projects module
    {'codename': 'projects.view', 'name': 'View Projects', 'module': 'projects'},
    {'codename': 'projects.create', 'name': 'Create Projects', 'module': 'projects'},
    {'codename': 'projects.edit', 'name': 'Edit Projects', 'module': 'projects'},
    {'codename': 'projects.delete', 'name': 'Delete Projects', 'module': 'projects'},
    {'codename': 'projects.manage_members', 'name': 'Manage Project Members', 'module': 'projects'},
    # SEO module
    {'codename': 'seo.view', 'name': 'View SEO Data', 'module': 'seo'},
    {'codename': 'seo.export', 'name': 'Export SEO Data', 'module': 'seo'},
    {'codename': 'seo.sync', 'name': 'Sync GSC Data', 'module': 'seo'},
    # KPI module
    {'codename': 'kpi.view', 'name': 'View KPIs', 'module': 'kpi'},
    {'codename': 'kpi.create', 'name': 'Create KPIs', 'module': 'kpi'},
    {'codename': 'kpi.edit', 'name': 'Edit KPIs', 'module': 'kpi'},
    {'codename': 'kpi.delete', 'name': 'Delete KPIs', 'module': 'kpi'},
    # Feedback module
    {'codename': 'feedback.view', 'name': 'View Feedback', 'module': 'feedback'},
    {'codename': 'feedback.create', 'name': 'Create Feedback', 'module': 'feedback'},
    {'codename': 'feedback.resolve', 'name': 'Resolve Feedback', 'module': 'feedback'},
    {'codename': 'feedback.delete', 'name': 'Delete Feedback', 'module': 'feedback'},
    # Reports module
    {'codename': 'reports.view', 'name': 'View Reports', 'module': 'reports'},
    {'codename': 'reports.create', 'name': 'Create Reports', 'module': 'reports'},
    {'codename': 'reports.export', 'name': 'Export Reports', 'module': 'reports'},
    {'codename': 'reports.schedule', 'name': 'Schedule Reports', 'module': 'reports'},
    # Dashboard module
    {'codename': 'dashboard.view', 'name': 'View Dashboards', 'module': 'dashboard'},
    {'codename': 'dashboard.create', 'name': 'Create Dashboards', 'module': 'dashboard'},
    {'codename': 'dashboard.edit', 'name': 'Edit Dashboards', 'module': 'dashboard'},
    {'codename': 'dashboard.share', 'name': 'Share Dashboards', 'module': 'dashboard'},
    # AI module
    {'codename': 'ai.use', 'name': 'Use AI Features', 'module': 'ai'},
    {'codename': 'ai.manage', 'name': 'Manage AI Settings', 'module': 'ai'},
    # System module
    {'codename': 'system.logs', 'name': 'View System Logs', 'module': 'system'},
    {'codename': 'system.backup', 'name': 'Manage Backups', 'module': 'system'},
    {'codename': 'system.settings', 'name': 'Manage System Settings', 'module': 'system'},
    {'codename': 'system.monitoring', 'name': 'View Monitoring', 'module': 'system'},
]

ROLE_PERMISSIONS = {
    'developer': [p['codename'] for p in PERMISSIONS],
    'company_manager': [
        'users.view', 'users.create', 'users.edit',
        'projects.view', 'projects.create', 'projects.edit', 'projects.manage_members',
        'seo.view', 'seo.export', 'seo.sync',
        'kpi.view', 'kpi.create', 'kpi.edit',
        'feedback.view', 'feedback.create', 'feedback.resolve',
        'reports.view', 'reports.create', 'reports.export', 'reports.schedule',
        'dashboard.view', 'dashboard.create', 'dashboard.edit', 'dashboard.share',
        'ai.use',
        'system.monitoring',
    ],
    'employee': [
        'projects.view',
        'seo.view',
        'kpi.view',
        'feedback.view', 'feedback.create',
        'reports.view',
        'dashboard.view', 'dashboard.create', 'dashboard.edit',
        'ai.use',
    ],
}


class Command(BaseCommand):
    help = 'Seed default permissions and roles'

    def handle(self, *args, **options):
        self.stdout.write('Seeding permissions...')
        for perm_data in PERMISSIONS:
            Permission.objects.get_or_create(
                codename=perm_data['codename'],
                defaults={'name': perm_data['name'], 'module': perm_data['module']},
            )
        self.stdout.write(self.style.SUCCESS(f'  {len(PERMISSIONS)} permissions seeded.'))

        self.stdout.write('Seeding roles...')
        role_slugs = {
            'developer': 'Developer',
            'company_manager': 'Company Manager',
            'employee': 'Employee',
        }
        for slug, name in role_slugs.items():
            role, _ = Role.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'is_system': True},
            )
            codenames = ROLE_PERMISSIONS.get(slug, [])
            permissions = Permission.objects.filter(codename__in=codenames)
            RolePermission.objects.filter(role=role).delete()
            RolePermission.objects.bulk_create(
                [RolePermission(role=role, permission=p) for p in permissions],
                ignore_conflicts=True,
            )
            self.stdout.write(f'  Role "{name}" seeded with {permissions.count()} permissions.')

        self.stdout.write(self.style.SUCCESS('RBAC seeding complete.'))