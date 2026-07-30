from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache


class Command(BaseCommand):
    help = 'Check if all services are properly configured'

    def handle(self, *args, **options):
        errors = []
        warnings = []

        self.stdout.write('Checking setup...\n')

        # Database
        try:
            connection.ensure_connection()
            self.stdout.write(self.style.SUCCESS('  ✔ Database connected'))
        except Exception as e:
            errors.append(f'Database: {e}')
            self.stdout.write(self.style.ERROR(f'  ✘ Database: {e}'))

        # Redis
        try:
            cache.set('check', '1', timeout=5)
            cache.get('check')
            self.stdout.write(self.style.SUCCESS('  ✔ Redis connected'))
        except Exception as e:
            errors.append(f'Redis: {e}')
            self.stdout.write(self.style.ERROR(f'  ✘ Redis: {e}'))

        # Migrations
        from django.db.migrations.executor import MigrationExecutor
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        if plan:
            warnings.append(f'{len(plan)} pending migrations')
            self.stdout.write(self.style.WARNING(f'  ⚠ {len(plan)} pending migrations'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✔ All migrations applied'))

        # Superuser
        from apps.users.models import User
        if User.objects.filter(role='developer').exists():
            self.stdout.write(self.style.SUCCESS('  ✔ Developer user exists'))
        else:
            warnings.append('No developer user found')
            self.stdout.write(self.style.WARNING('  ⚠ No developer user found'))

        # Permissions
        from apps.rbac.models import Permission
        perm_count = Permission.objects.count()
        if perm_count >= 33:
            self.stdout.write(self.style.SUCCESS(f'  ✔ {perm_count} permissions seeded'))
        else:
            warnings.append(f'Only {perm_count} permissions. Run seed_permissions.')
            self.stdout.write(self.style.WARNING(f'  ⚠ Only {perm_count} permissions'))

        # Periodic Tasks
        from django_celery_beat.models import PeriodicTask
        task_count = PeriodicTask.objects.count()
        if task_count >= 5:
            self.stdout.write(self.style.SUCCESS(f'  ✔ {task_count} periodic tasks configured'))
        else:
            warnings.append(f'Only {task_count} periodic tasks. Run setup_periodic_tasks.')
            self.stdout.write(self.style.WARNING(f'  ⚠ Only {task_count} periodic tasks'))

        # Feature Flags
        from apps.rbac.models import FeatureFlag
        flag_count = FeatureFlag.objects.count()
        if flag_count >= 4:
            self.stdout.write(self.style.SUCCESS(f'  ✔ {flag_count} feature flags configured'))
        else:
            warnings.append('Feature flags not seeded. Run seed_initial_data.')
            self.stdout.write(self.style.WARNING('  ⚠ Feature flags not seeded'))

        self.stdout.write('')
        if errors:
            self.stdout.write(self.style.ERROR(f'Setup has {len(errors)} error(s). Fix before running.'))
            for e in errors:
                self.stdout.write(self.style.ERROR(f'  - {e}'))
        elif warnings:
            self.stdout.write(self.style.WARNING(f'Setup has {len(warnings)} warning(s).'))
        else:
            self.stdout.write(self.style.SUCCESS('All checks passed! System ready.'))