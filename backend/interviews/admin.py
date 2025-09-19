from django.contrib import admin
from .models import Company, JobPosition, Interview
from .student_admin import StudentInfoAdmin, EducationHistoryAdmin, CertificateAdmin

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'website', 'created_time']
    list_filter = ['created_time']
    search_fields = ['name', 'description']
    readonly_fields = ['created_time']

@admin.register(JobPosition)
class JobPositionAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'level', 'created_time']
    list_filter = ['company', 'level', 'created_time']
    search_fields = ['title', 'description', 'requirements']
    readonly_fields = ['created_time']

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = [
        'candidate_name', 'company', 'position', 'interview_method',
        'interview_round', 'scheduled_time', 'status', 'result', 'recording_uploaded'
    ]
    list_filter = [
        'company', 'interview_method', 'interview_round', 
        'status', 'result', 'scheduled_time'
    ]
    search_fields = ['candidate_name', 'candidate_phone', 'candidate_email']
    readonly_fields = ['created_time', 'updated_time', 'completed_time']
    
    fieldsets = (
        ('候选人信息', {
            'fields': ('candidate_name', 'candidate_phone', 'candidate_email')
        }),
        ('面试信息', {
            'fields': ('company', 'position', 'interview_method', 'interview_round')
        }),
        ('时间安排', {
            'fields': ('scheduled_time', 'duration')
        }),
        ('面试官信息', {
            'fields': ('interviewer', 'interviewer_notes')
        }),
        ('面试过程', {
            'fields': ('status', 'result', 'score', 'feedback')
        }),
        ('录音文件', {
            'fields': ('recording', 'recording_uploaded')
        }),
        ('时间戳', {
            'fields': ('created_time', 'updated_time', 'completed_time'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status == 'completed' and obj.recording_uploaded:
            # 已完成且已上传录音的面试不能修改
            return [f.name for f in self.model._meta.fields]
        return self.readonly_fields
