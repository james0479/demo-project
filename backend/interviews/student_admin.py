from django.contrib import admin
from .student_models import StudentInfo, EducationHistory, Certificate

@admin.register(StudentInfo)
class StudentInfoAdmin(admin.ModelAdmin):
    list_display = ['name', 'id_card', 'phone', 'education_level', 'graduation_date', 'marketing_department']
    list_filter = ['education_level', 'education_status', 'marketing_department', 'created_time']
    search_fields = ['name', 'id_card', 'phone', 'school_name']
    readonly_fields = ['created_time', 'updated_time']
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'id_card', 'phone', 'father_phone', 'mother_phone', 'home_address')
        }),
        ('教育信息', {
            'fields': ('education_level', 'graduation_date', 'school_name', 'major', 'education_status')
        }),
        ('管理信息', {
            'fields': ('project_manager', 'employment_guide', 'marketing_department')
        }),
        ('其他信息', {
            'fields': ('certificates', 'created_time', 'updated_time'),
            'classes': ('collapse',)
        }),
    )

@admin.register(EducationHistory)
class EducationHistoryAdmin(admin.ModelAdmin):
    list_display = ['student', 'education_level', 'graduation_date', 'school_name']
    list_filter = ['education_level', 'graduation_date']
    search_fields = ['student__name', 'school_name']

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['student', 'name', 'issue_date', 'issuing_authority']
    list_filter = ['issue_date']
    search_fields = ['student__name', 'name']
