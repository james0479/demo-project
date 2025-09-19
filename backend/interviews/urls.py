from django.urls import path, include
from rest_framework import routers
from .views import (
    CompanyViewSet, JobPositionViewSet, InterviewViewSet,
    dashboard_stats, interview_calendar, get_csrf_token
)
from .student_views import StudentInfoViewSet, EducationHistoryViewSet, CertificateViewSet

router = routers.DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'positions', JobPositionViewSet)
router.register(r'interviews', InterviewViewSet)
router.register(r'students', StudentInfoViewSet)
router.register(r'education-histories', EducationHistoryViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/calendar/', interview_calendar, name='interview-calendar'),
    path('csrf/', get_csrf_token, name='get-csrf'),
]
