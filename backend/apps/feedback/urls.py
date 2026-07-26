from django.urls import path
from .views import (
    FeedbackThreadListView, FeedbackThreadDetailView,
    FeedbackThreadResolveView, FeedbackThreadAssignView,
    FeedbackThreadSeenView,
    FeedbackCommentListView, FeedbackCommentDetailView,
)

urlpatterns = [
    path('projects/<uuid:project_id>/threads/', FeedbackThreadListView.as_view(), name='feedback-thread-list'),
    path('threads/<uuid:thread_id>/', FeedbackThreadDetailView.as_view(), name='feedback-thread-detail'),
    path('threads/<uuid:thread_id>/resolve/', FeedbackThreadResolveView.as_view(), name='feedback-thread-resolve'),
    path('threads/<uuid:thread_id>/assign/', FeedbackThreadAssignView.as_view(), name='feedback-thread-assign'),
    path('threads/<uuid:thread_id>/seen/', FeedbackThreadSeenView.as_view(), name='feedback-thread-seen'),
    path('threads/<uuid:thread_id>/comments/', FeedbackCommentListView.as_view(), name='feedback-comment-list'),
    path('comments/<uuid:comment_id>/', FeedbackCommentDetailView.as_view(), name='feedback-comment-detail'),
]