from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'companies', views.CompanyViewSet)
router.register(r'positions', views.JobPositionViewSet)
router.register(r'interviews', views.InterviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('get_csrf_token/', views.get_csrf_token, name='get-csrf-token'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('interview_calendar/', views.interview_calendar, name='interview-calendar'),
    path('auth/user/', views.current_user, name='current-user'),
]
