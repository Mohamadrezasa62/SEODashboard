# from django.contrib import admin
# from .models import BackupRecord


# @admin.register(BackupRecord)
# class BackupRecordAdmin(admin.ModelAdmin):
#     list_display = ('name', 'backup_type', 'status', 'file_size', 'initiated_by', 'created_at')
#     list_filter = ('backup_type', 'status')
#     readonly_fields = ('created_at', 'started_at', 'finished_at', 'checksum')

from django.contrib import admin
from .models import BackupRecord, RestoreRecord


@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    list_display = ('name', 'backup_type', 'status', 'file_size', 'is_verified', 'initiated_by', 'created_at')
    list_filter = ('backup_type', 'status', 'is_verified')
    readonly_fields = ('created_at', 'started_at', 'finished_at', 'checksum')


@admin.register(RestoreRecord)
class RestoreRecordAdmin(admin.ModelAdmin):
    list_display = ('backup', 'status', 'initiated_by', 'started_at', 'finished_at')
    list_filter = ('status',)
    readonly_fields = ('created_at', 'started_at', 'finished_at')