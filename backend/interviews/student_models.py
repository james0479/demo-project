from django.db import models
from django.core.validators import RegexValidator

class StudentInfo(models.Model):
    EDUCATION_LEVEL_CHOICES = [
        ('middle_school', '初中'),
        ('high_school', '高中'),
        ('secondary', '中专'),
        ('college', '大专'),
        ('bachelor', '本科'),
        ('master', '硕士'),
        ('doctor', '博士'),
    ]
    
    STATUS_CHOICES = [
        ('studying', '在读'),
        ('graduated', '已毕业'),
        ('suspended', '休学'),
        ('dropped', '退学'),
    ]
    
    # 基本信息
    name = models.CharField(max_length=100, verbose_name="学生姓名")
    id_card = models.CharField(
        max_length=18, 
        unique=True, 
        verbose_name="身份证号",
        validators=[RegexValidator(r'^\d{17}[\dXx]$', '请输入正确的身份证号码')]
    )
    phone = models.CharField(
        max_length=11, 
        verbose_name="学生电话",
        validators=[RegexValidator(r'^1[3-9]\d{9}$', '请输入正确的手机号码')]
    )
    father_phone = models.CharField(
        max_length=11, 
        blank=True, 
        verbose_name="父亲电话",
        validators=[RegexValidator(r'^1[3-9]\d{9}$', '请输入正确的手机号码')]
    )
    mother_phone = models.CharField(
        max_length=11, 
        blank=True, 
        verbose_name="母亲电话",
        validators=[RegexValidator(r'^1[3-9]\d{9}$', '请输入正确的手机号码')]
    )
    home_address = models.CharField(max_length=200, verbose_name="家庭住址")
    
    # 教育信息
    education_level = models.CharField(max_length=20, choices=EDUCATION_LEVEL_CHOICES, verbose_name="当前学历")
    graduation_date = models.DateField(verbose_name="毕业日期")
    school_name = models.CharField(max_length=100, verbose_name="毕业院校")
    major = models.CharField(max_length=100, verbose_name="专业")
    education_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='studying', verbose_name="在读状态")
    
    # 管理信息
    project_manager = models.CharField(max_length=50, verbose_name="项目经理")
    employment_guide = models.CharField(max_length=50, verbose_name="就业指导")
    marketing_department = models.CharField(max_length=100, verbose_name="所属市场部")
    
    # 证书信息
    certificates = models.TextField(blank=True, verbose_name="所持证书")
    
    # 时间戳
    created_time = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_time = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "学生基础信息"
        verbose_name_plural = verbose_name
        ordering = ['-created_time']
    
    def __str__(self):
        return f"{self.name} - {self.id_card}"
    
    def age(self):
        """根据身份证计算年龄"""
        from datetime import date
        if len(self.id_card) == 18:
            birth_year = int(self.id_card[6:10])
            birth_month = int(self.id_card[10:12])
            birth_day = int(self.id_card[12:14])
            today = date.today()
            age = today.year - birth_year - ((today.month, today.day) < (birth_month, birth_day))
            return age
        return None

class EducationHistory(models.Model):
    student = models.ForeignKey(StudentInfo, on_delete=models.CASCADE, related_name='education_histories')
    education_level = models.CharField(max_length=20, choices=StudentInfo.EDUCATION_LEVEL_CHOICES, verbose_name="学历")
    graduation_date = models.DateField(verbose_name="毕业时间")
    school_name = models.CharField(max_length=100, verbose_name="毕业院校")
    major = models.CharField(max_length=100, verbose_name="专业")
    
    class Meta:
        verbose_name = "教育经历"
        verbose_name_plural = verbose_name
        ordering = ['-graduation_date']
    
    def __str__(self):
        return f"{self.student.name} - {self.get_education_level_display()}"

class Certificate(models.Model):
    student = models.ForeignKey(StudentInfo, on_delete=models.CASCADE, related_name='certificate_list')
    name = models.CharField(max_length=100, verbose_name="证书名称")
    issue_date = models.DateField(verbose_name="发证日期")
    issuing_authority = models.CharField(max_length=100, verbose_name="发证机构")
    certificate_number = models.CharField(max_length=100, blank=True, verbose_name="证书编号")
    
    class Meta:
        verbose_name = "证书信息"
        verbose_name_plural = verbose_name
    
    def __str__(self):
        return f"{self.student.name} - {self.name}"
