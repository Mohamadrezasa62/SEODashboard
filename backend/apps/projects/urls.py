from django.urls import path
from .views import (
    ProjectListView, ProjectDetailView, ProjectArchiveView,
    ProjectMembersView, ProjectMemberDetailView,
)

urlpatterns = [
    path('', ProjectListView.as_view(), name='project-list'),
    path('<uuid:project_id>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<uuid:project_id>/archive/', ProjectArchiveView.as_view(), name='project-archive'),
    path('<uuid:project_id>/members/', ProjectMembersView.as_view(), name='project-members'),
    path('<uuid:project_id>/members/<uuid:user_id>/', ProjectMemberDetailView.as_view(), name='project-member-detail'),
]