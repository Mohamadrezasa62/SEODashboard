from django.urls import path
from .views import MeView, ChangePasswordView, UserListView, UserCreateView, UserDetailView

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('', UserListView.as_view(), name='user-list'),
    path('create/', UserCreateView.as_view(), name='user-create'),
    path('<uuid:user_id>/', UserDetailView.as_view(), name='user-detail'),
]