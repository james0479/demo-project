from rest_framework import viewsets, status, mixins
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q, Case, When, IntegerField
from django.utils import timezone
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.contrib.auth.models import User
from .models import Company, JobPosition, Interview
from .serializers import (
    CompanySerializer, JobPositionSerializer, 
    InterviewSerializer, InterviewCreateSerializer, InterviewUpdateSerializer
)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

class JobPositionViewSet(viewsets.ModelViewSet):
    queryset = JobPosition.objects.all()
    serializer_class = JobPositionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = JobPosition.objects.all()
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Interview.objects.all()
        
        # 如果是面试官，只能看到自己的面试
        if not user.is_staff:
            queryset = queryset.filter(interviewer=user)
        
        # 状态筛选
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 时间范围筛选
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from and date_to:
            queryset = queryset.filter(scheduled_time__date__range=[date_from, date_to])
        
        return queryset.order_by('-scheduled_time')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InterviewCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InterviewUpdateSerializer
        return InterviewSerializer
    
    @action(detail=True, methods=['post'])
    def upload_recording(self, request, pk=None):
        """上传面试录音"""
        interview = self.get_object()
        
        if 'recording' not in request.FILES:
            return Response({'error': '请选择录音文件'}, status=status.HTTP_400_BAD_REQUEST)
        
        interview.recording = request.FILES['recording']
        interview.save()
        
        return Response({'message': '录音上传成功'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def complete_interview(self, request, pk=None):
        """完成面试（必须已上传录音）"""
        interview = self.get_object()
        
        if not interview.recording_uploaded:
            return Response(
                {'error': '完成面试前必须上传录音'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        interview.status = 'completed'
        interview.save()
        
        return Response({'message': '面试已完成'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def upcoming_interviews(self, request):
        """获取即将到来的面试"""
        now = timezone.now()
        upcoming = Interview.objects.filter(
            scheduled_time__gte=now,
            status__in=['scheduled', 'in_progress']
        ).order_by('scheduled_time')[:10]
        
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_interviews(self, request):
        """获取当前用户的面试"""
        user = request.user
        interviews = Interview.objects.filter(interviewer=user).order_by('-scheduled_time')
        
        status_filter = request.query_params.get('status')
        if status_filter:
            interviews = interviews.filter(status=status_filter)
        
        serializer = self.get_serializer(interviews, many=True)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """获取CSRF token"""
    return Response({'csrfToken': get_token(request)})

@api_view(['GET'])
def current_user(request):
    """获取当前用户信息"""
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_staff': request.user.is_staff
        })
    return Response({'error': '未登录'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """获取看板统计数据"""
    user = request.user
    
    # 基础查询
    if user.is_staff:
        interviews = Interview.objects.all()
    else:
        interviews = Interview.objects.filter(interviewer=user)
    
    # 今日面试
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timezone.timedelta(days=1)
    today_count = interviews.filter(
        scheduled_time__range=[today_start, today_end]
    ).count()
    
    # 本周面试
    week_start = today_start - timezone.timedelta(days=today_start.weekday())
    week_end = week_start + timezone.timedelta(days=7)
    week_count = interviews.filter(
        scheduled_time__range=[week_start, week_end]
    ).count()
    
    # 状态统计
    status_stats = interviews.values('status').annotate(count=Count('id'))
    
    # 需要录音的面试（已完成但未上传录音）
    need_recording = interviews.filter(
        status='completed', 
        recording_uploaded=False
    ).count()
    
    return Response({
        'today_count': today_count,
        'week_count': week_count,
        'status_stats': list(status_stats),
        'need_recording': need_recording,
        'total_count': interviews.count()
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_calendar(request):
    """获取面试日历数据"""
    user = request.user
    month = request.GET.get('month')
    year = request.GET.get('year')
    
    if user.is_staff:
        interviews = Interview.objects.all()
    else:
        interviews = Interview.objects.filter(interviewer=user)
    
    if month and year:
        interviews = interviews.filter(
            scheduled_time__year=year,
            scheduled_time__month=month
        )
    
    calendar_data = interviews.values(
        'scheduled_time__date'
    ).annotate(
        count=Count('id'),
        completed=Count(Case(When(status='completed', then=1), output_field=IntegerField())),
        scheduled=Count(Case(When(status='scheduled', then=1), output_field=IntegerField()))
    ).order_by('scheduled_time__date')
    
    return Response(list(calendar_data))
