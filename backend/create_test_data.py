import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'interview_system.settings')
django.setup()

from django.contrib.auth.models import User
from interviews.models import Company, JobPosition, Interview
from django.utils import timezone
from datetime import timedelta

def create_test_data():
    print("开始创建测试数据...")
    
    # 创建管理员用户
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("创建管理员用户: admin / admin123")
    
    # 创建面试官用户
    interviewer1, created = User.objects.get_or_create(
        username='interviewer1',
        defaults={
            'first_name': '张',
            'last_name': '面试官',
            'email': 'interviewer1@example.com',
            'is_staff': True
        }
    )
    if created:
        interviewer1.set_password('password123')
        interviewer1.save()
        print("创建面试官1: interviewer1 / password123")
    
    interviewer2, created = User.objects.get_or_create(
        username='interviewer2',
        defaults={
            'first_name': '李',
            'last_name': '面试官',
            'email': 'interviewer2@example.com'
        }
    )
    if created:
        interviewer2.set_password('password123')
        interviewer2.save()
        print("创建面试官2: interviewer2 / password123")
    
    # 创建公司
    company1, created = Company.objects.get_or_create(
        name='科技有限公司',
        defaults={
            'description': '一家专注于技术创新的科技公司',
            'website': 'https://tech.example.com'
        }
    )
    if created:
        print(f"创建公司: {company1.name}")
    
    company2, created = Company.objects.get_or_create(
        name='互联网有限公司',
        defaults={
            'description': '领先的互联网服务提供商',
            'website': 'https://internet.example.com'
        }
    )
    if created:
        print(f"创建公司: {company2.name}")
    
    # 创建职位
    position1, created = JobPosition.objects.get_or_create(
        company=company1,
        title='高级后端开发工程师',
        defaults={
            'description': '负责公司核心业务的后端开发工作，参与系统架构设计',
            'requirements': '5年以上Java/Python开发经验，熟悉分布式系统，有高并发处理经验',
            'level': '高级',
            'salary_range': '25-40K'
        }
    )
    if created:
        print(f"创建职位: {position1.title}")
    
    position2, created = JobPosition.objects.get_or_create(
        company=company2,
        title='前端开发工程师',
        defaults={
            'description': '负责公司产品的前端界面开发和用户体验优化',
            'requirements': '3年以上前端开发经验，精通Vue/React框架，有移动端开发经验',
            'level': '中级',
            'salary_range': '20-30K'
        }
    )
    if created:
        print(f"创建职位: {position2.title}")
    
    position3, created = JobPosition.objects.get_or_create(
        company=company1,
        title='测试开发工程师',
        defaults={
            'description': '负责自动化测试框架开发和测试工具维护',
            'requirements': '3年以上测试开发经验，熟悉Python/Java，有自动化测试经验',
            'level': '中级',
            'salary_range': '18-28K'
        }
    )
    if created:
        print(f"创建职位: {position3.title}")
    
    # 创建面试数据
    interviews_data = [
        {
            'candidate_name': '张三',
            'candidate_phone': '13800138001',
            'candidate_email': 'zhangsan@example.com',
            'company': company1,
            'position': position1,
            'interview_method': 'video',
            'interview_round': 'first',
            'scheduled_time': timezone.now() + timedelta(hours=2),
            'interviewer': interviewer1,
            'status': 'scheduled',
            'duration': 60
        },
        {
            'candidate_name': '李四',
            'candidate_phone': '13800138002',
            'candidate_email': 'lisi@example.com',
            'company': company2,
            'position': position2,
            'interview_method': 'onsite',
            'interview_round': 'second',
            'scheduled_time': timezone.now() + timedelta(days=1),
            'interviewer': interviewer2,
            'status': 'scheduled',
            'duration': 90
        },
        {
            'candidate_name': '王五',
            'candidate_phone': '13800138003',
            'candidate_email': 'wangwu@example.com',
            'company': company1,
            'position': position3,
            'interview_method': 'phone',
            'interview_round': 'final',
            'scheduled_time': timezone.now() - timedelta(days=1),
            'interviewer': interviewer1,
            'status': 'completed',
            'result': 'passed',
            'score': 85,
            'feedback': '技术能力很强，沟通表达清晰，有丰富的测试框架开发经验',
            'duration': 45
        },
        {
            'candidate_name': '赵六',
            'candidate_phone': '13800138004',
            'candidate_email': 'zhaoliu@example.com',
            'company': company2,
            'position': position2,
            'interview_method': 'video',
            'interview_round': 'first',
            'scheduled_time': timezone.now() + timedelta(days=2),
            'interviewer': interviewer2,
            'status': 'scheduled',
            'duration': 60
        },
        {
            'candidate_name': '钱七',
            'candidate_phone': '13800138005',
            'candidate_email': 'qianqi@example.com',
            'company': company1,
            'position': position1,
            'interview_method': 'onsite',
            'interview_round': 'third',
            'scheduled_time': timezone.now() - timedelta(days=3),
            'interviewer': interviewer1,
            'status': 'completed',
            'result': 'rejected',
            'score': 65,
            'feedback': '基础技术尚可，但缺乏系统架构经验，不符合高级职位要求',
            'duration': 75
        }
    ]
    
    for i, data in enumerate(interviews_data, 1):
        interview, created = Interview.objects.get_or_create(
            candidate_email=data['candidate_email'],
            scheduled_time=data['scheduled_time'],
            defaults=data
        )
        if created:
            print(f"创建面试 #{i}: {interview.candidate_name} - {interview.company.name}")
    
    print("\n测试数据创建完成！")
    print("\n登录信息:")
    print("管理员后台: http://127.0.0.1:8000/admin/")
    print("管理员账号: admin / admin123")
    print("面试官1账号: interviewer1 / password123")
    print("面试官2账号: interviewer2 / password123")
    print("\nAPI端点:")
    print("面试列表: http://127.0.0.1:8000/api/interviews/")
    print("看板统计: http://127.0.0.1:8000/api/dashboard/stats/")

if __name__ == '__main__':
    create_test_data()
