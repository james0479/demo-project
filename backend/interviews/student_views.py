from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .student_models import StudentInfo, EducationHistory, Certificate
from .student_serializers import (
    StudentInfoSerializer, StudentInfoCreateSerializer, 
    EducationHistorySerializer, CertificateSerializer,
    StudentImportSerializer
)
import pandas as pd
from datetime import datetime

class StudentInfoViewSet(viewsets.ModelViewSet):
    queryset = StudentInfo.objects.all().select_related('created_by')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudentInfoCreateSerializer
        return StudentInfoSerializer
    
    def get_queryset(self):
        queryset = StudentInfo.objects.all()
        
        # 搜索过滤
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(id_card__icontains=search) |
                models.Q(phone__icontains=search) |
                models.Q(school_name__icontains=search)
            )
        
        # 部门过滤
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(marketing_department=department)
        
        # 学历过滤
        education = self.request.query_params.get('education')
        if education:
            queryset = queryset.filter(education_level=education)
        
        return queryset.order_by('-created_time')
    
    @action(detail=True, methods=['get'])
    def detail_info(self, request, pk=None):
        student = self.get_object()
        serializer = self.get_serializer(student)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def import_students(self, request):
        serializer = StudentImportSerializer(data=request.data)
        if serializer.is_valid():
            try:
                file = request.FILES['file']
                df = pd.read_excel(file)
                
                imported_count = 0
                errors = []
                
                for index, row in df.iterrows():
                    try:
                        student_data = {
                            'name': row.get('学生姓名', ''),
                            'id_card': str(row.get('身份证', '')).strip(),
                            'phone': str(row.get('学生电话', '')),
                            'father_phone': str(row.get('父亲电话', '')),
                            'mother_phone': str(row.get('母亲电话', '')),
                            'home_address': row.get('家庭住址', ''),
                            'education_level': row.get('当前学历', ''),
                            'graduation_date': row.get('毕业日期', datetime.now().date()),
                            'school_name': row.get('毕业院校', ''),
                            'major': row.get('专业', ''),
                            'project_manager': row.get('项目经理', ''),
                            'employment_guide': row.get('就业指导', ''),
                            'marketing_department': row.get('所属市场部', ''),
                            'certificates': row.get('所持证书', ''),
                        }
                        
                        # 创建或更新学生信息
                        student, created = StudentInfo.objects.update_or_create(
                            id_card=student_data['id_card'],
                            defaults=student_data
                        )
                        
                        if created:
                            imported_count += 1
                            
                    except Exception as e:
                        errors.append(f"第{index+2}行错误: {str(e)}")
                
                return Response({
                    'success': True,
                    'imported_count': imported_count,
                    'errors': errors
                })
                
            except Exception as e:
                return Response({
                    'success': False,
                    'error': f'文件处理错误: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def export_students(self, request):
        students = self.get_queryset()
        data = []
        
        for student in students:
            data.append({
                '学生姓名': student.name,
                '身份证': student.id_card,
                '学生电话': student.phone,
                '父亲电话': student.father_phone,
                '母亲电话': student.mother_phone,
                '家庭住址': student.home_address,
                '当前学历': student.get_education_level_display(),
                '毕业日期': student.graduation_date,
                '毕业院校': student.school_name,
                '专业': student.major,
                '在读状态': student.get_education_status_display(),
                '项目经理': student.project_manager,
                '就业指导': student.employment_guide,
                '所属市场部': student.marketing_department,
                '所持证书': student.certificates,
                '创建时间': student.created_time,
                '更新时间': student.updated_time,
            })
        
        df = pd.DataFrame(data)
        response = HttpResponse(content_type='application/vnd.ms-excel')
        response['Content-Disposition'] = 'attachment; filename="学生信息导出.xlsx"'
        df.to_excel(response, index=False)
        return response

class EducationHistoryViewSet(viewsets.ModelViewSet):
    queryset = EducationHistory.objects.all()
    serializer_class = EducationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
