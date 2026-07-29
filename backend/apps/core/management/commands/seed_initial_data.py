from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial data for production'

    def add_arguments(self, parser):
        parser.add_argument('--admin-email', type=str, default='admin@seodashboard.com')
        parser.add_argument('--admin-password', type=str, default='Admin1234!')
        parser.add_argument('--skip-permissions', action='store_true')

    def handle(self, *args, **options):
        if not options['skip_permissions']:
            self.stdout.write('Seeding permissions...')
            from django.core.management import call_command
            call_command('seed_permissions')

        email = options['admin_email']
        password = options['admin_password']

        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
                first_name='Admin',
                last_name='Developer',
                role='developer',
                is_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser created: {email}'))
        else:
            self.stdout.write(f'Superuser already exists: {email}')

        self._seed_feature_flags()
        self.stdout.write(self.style.SUCCESS('Initial data seeding complete.'))

    def _seed_feature_flags(self):
        from apps.rbac.models import FeatureFlag
        flags = [
            {
                'name': 'AI Features',
                'slug': 'ai-features',
                'description': 'Enable AI-powered SEO suggestions',
                'is_enabled': True,
                'allowed_roles': ['developer', 'company_manager'],
            },
            {
                'name': 'Advanced Reports',
                'slug': 'advanced-reports',
                'description': 'Enable advanced report builder',
                'is_enabled': True,
                'allowed_roles': [],
            },
            {
                'name': 'GSC Integration',
                'slug': 'gsc-integration',
                'description': 'Enable Google Search Console integration',
                'is_enabled': True,
                'allowed_roles': [],
            },
            {
                'name': 'Dashboard Builder',
                'slug': 'dashboard-builder',
                'description': 'Enable custom dashboard builder',
                'is_enabled': True,
                'allowed_roles': [],
            },
        ]
        for flag_data in flags:
            FeatureFlag.objects.get_or_create(
                slug=flag_data['slug'],
                defaults=flag_data,
            )
        self.stdout.write(f'  {len(flags)} feature flags seeded.')