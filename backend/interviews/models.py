# 在文件顶部添加
from .student_models import StudentInfo, EducationHistory, Certificate
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Company(models.Model):
    name = models.CharField(max_length=200, verbose_name="公司名称")
    description = models.TextField(blank=True, verbose_name="公司描述")
    website = models.URLField(blank=True, verbose_name="官网")
    created_time = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "公司"
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name

class JobPosition(models.Model):
    title = models.CharField(max_length=200, verbose_name="职位名称")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, verbose_name="公司")
    description = models.TextField(verbose_name="职位描述")
    requirements = models.TextField(verbose_name="职位要求")
    level = models.CharField(max_length=100, verbose_name="职级")
    salary_range = models.CharField(max_length=100, blank=True, verbose_name="薪资范围")
    created_time = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "职位"
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.company.name} - {self.title}"

class Interview(models.Model):
    INTERVIEW_METHOD_CHOICES = [
        ('phone', '电话面试'),
        ('video', '视频面试'),
        ('onsite', '现场面试'),
    ]

    INTERVIEW_ROUND_CHOICES = [
        ('first', '初试'),
        ('second', '二面'),
        ('third', '三面'),
        ('final', '终面'),
        ('other', '其他轮次'),
    ]

    INTERVIEW_STATUS_CHOICES = [
        ('scheduled', '已安排'),
        ('in_progress', '面试中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    INTERVIEW_RESULT_CHOICES = [
        ('pending', '待定'),
        ('passed', '通过'),
        ('rejected', '未通过'),
        ('offer', '发放Offer'),
        ('declined', '已拒绝'),
    ]

    # 基本信息
    candidate_name = models.CharField(max_length=100, verbose_name="候选人姓名")
    candidate_phone = models.CharField(max_length=20, verbose_name="候选人电话")
    candidate_email = models.EmailField(verbose_name="候选人邮箱")

    # 面试信息 - 改为直接存储文本
    company_name = models.CharField(max_length=200, verbose_name="公司名称")
    position_title = models.CharField(max_length=200, verbose_name="职位名称")
    position_description = models.TextField(blank=True, verbose_name="岗位描述")
    
    # 保留外键用于关联查询（可选，可以注释掉）
    company = models.ForeignKey(
        Company, 
        on_delete=models.SET_NULL, 
        verbose_name="关联公司",
        null=True, 
        blank=True
    )
    position = models.ForeignKey(
        JobPosition, 
        on_delete=models.SET_NULL, 
        verbose_name="关联职位",
        null=True, 
        blank=True
    )
    
    interview_method = models.CharField(max_length=10, choices=INTERVIEW_METHOD_CHOICES, verbose_name="面试方式")
    interview_round = models.CharField(max_length=10, choices=INTERVIEW_ROUND_CHOICES, verbose_name="面试轮次")
    scheduled_time = models.DateTimeField(verbose_name="面试时间")
    duration = models.PositiveIntegerField(default=60, verbose_name="预计时长(分钟)")

    # 面试官信息
    interviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        verbose_name="面试官",
        null=True,
        blank=True
    )
    interviewer_notes = models.TextField(blank=True, verbose_name="面试官备注")

    # 面试过程
    status = models.CharField(max_length=20, choices=INTERVIEW_STATUS_CHOICES, default='scheduled', verbose_name="状态")
    result = models.CharField(max_length=20, choices=INTERVIEW_RESULT_CHOICES, default='pending', verbose_name="面试结果")
    score = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="评分(1-100)"
    )
    feedback = models.TextField(blank=True, verbose_name="面试反馈")

    # 录音文件
    recording = models.FileField(
        upload_to='interview_recordings/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name="面试录音"
    )
    recording_uploaded = models.BooleanField(default=False, verbose_name="录音已上传")

    # 时间戳
    created_time = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_time = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    completed_time = models.DateTimeField(null=True, blank=True, verbose_name="完成时间")

    class Meta:
        verbose_name = "面试"
        verbose_name_plural = verbose_name
        ordering = ['-scheduled_time']

    def __str__(self):
        return f"{self.candidate_name} - {self.company_name} - {self.position_title}"

    def can_complete(self):
        """检查是否可以完成面试（必须上传录音）"""
        return self.status == 'completed' and self.recording_uploaded

    def save(self, *args, **kwargs):
        # 自动更新录音上传状态
        if self.recording:
            self.recording_uploaded = True
        else:
            self.recording_uploaded = False

        # 如果状态变为已完成，记录完成时间
        if self.status == 'completed' and not self.completed_time:
            from django.utils import timezone
            self.completed_time = timezone.now()

        # 自动关联公司和职位（可选）
        if not self.company_id and self.company_name:
            company, created = Company.objects.get_or_create(
                name=self.company_name,
                defaults={'description': f'{self.company_name} - 自动创建'}
            )
            self.company = company

        if not self.position_id and self.position_title:
            # 如果有关联公司，使用关联公司创建职位
            company = self.company if self.company else None
            if company:
                position, created = JobPosition.objects.get_or_create(
                    title=self.position_title,
                    company=company,
                    defaults={
                        'description': self.position_description or f'{self.position_title} - 自动创建',
                        'requirements': '暂无要求信息',
                        'level': '未指定'
                    }
                )
                self.position = position

        super().save(*args, **kwargs)
