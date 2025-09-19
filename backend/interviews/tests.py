from django.test import TestCase
from django.contrib.auth.models import User
from .models import Company, JobPosition, Interview
from django.utils import timezone

class InterviewModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', 
            password='testpass123'
        )
        self.company = Company.objects.create(
            name='测试公司',
            description='测试描述'
        )
        self.position = JobPosition.objects.create(
            title='测试职位',
            company=self.company,
            description='职位描述',
            requirements='职位要求',
            level='中级'
        )
    
    def test_create_interview(self):
        interview = Interview.objects.create(
            candidate_name='测试候选人',
            candidate_phone='13800138000',
            candidate_email='test@example.com',
            company=self.company,
            position=self.position,
            interview_method='video',
            interview_round='first',
            scheduled_time=timezone.now(),
            interviewer=self.user
        )
        self.assertEqual(interview.status, 'scheduled')
        self.assertFalse(interview.recording_uploaded)
