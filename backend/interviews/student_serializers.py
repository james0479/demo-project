from rest_framework import serializers
from .student_models import StudentInfo, EducationHistory, Certificate
from django.contrib.auth.models import User

class EducationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationHistory
        fields = '__all__'

class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = '__all__'

class StudentInfoSerializer(serializers.ModelSerializer):
    education_histories = EducationHistorySerializer(many=True, read_only=True)
    certificate_list = CertificateSerializer(many=True, read_only=True)
    age = serializers.ReadOnlyField()
    created_by = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StudentInfo
        fields = '__all__'
        read_only_fields = ['created_time', 'updated_time']
    
    def validate_id_card(self, value):
        # 简单的身份证验证
        if len(value) not in [15, 18]:
            raise serializers.ValidationError("身份证号码长度不正确")
        return value

class StudentInfoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentInfo
        fields = [
            'name', 'id_card', 'phone', 'father_phone', 'mother_phone',
            'home_address', 'education_level', 'graduation_date', 'school_name',
            'major', 'education_status', 'project_manager', 'employment_guide',
            'marketing_department', 'certificates'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class StudentImportSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    def validate_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError("只支持Excel文件")
        return value
