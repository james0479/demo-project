from rest_framework import serializers
from .models import Company, JobPosition, Interview
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class JobPositionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = JobPosition
        fields = '__all__'

class InterviewSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    position_title = serializers.CharField(source='position.title', read_only=True)
    position_description = serializers.CharField(source='position.description', read_only=True)
    interviewer_info = UserSerializer(source='interviewer', read_only=True)

    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['recording_uploaded', 'completed_time', 'created_time', 'updated_time']

    def validate(self, data):
        # 验证面试时间不能是过去的时间
        if 'scheduled_time' in data and data['scheduled_time']:
            from django.utils import timezone
            if data['scheduled_time'] < timezone.now():
                raise serializers.ValidationError("面试时间不能是过去的时间")

        # 验证已完成面试必须上传录音
        if self.instance and self.instance.status == 'completed' and not self.instance.recording_uploaded:
            raise serializers.ValidationError("已完成面试必须上传录音")

        return data

class InterviewCreateSerializer(serializers.ModelSerializer):
    # 新增文本字段（前端直接发送文本而不是外键ID）
    company_name = serializers.CharField(write_only=True, max_length=200)
    position_title = serializers.CharField(write_only=True, max_length=200)
    position_description = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Interview
        fields = [
            'candidate_name', 'candidate_phone', 'candidate_email',
            'company_name', 'position_title', 'position_description',  # 新增文本字段
            'interview_method', 'interview_round', 'scheduled_time',
            'duration', 'interviewer_notes'
        ]
        extra_kwargs = {
            'interviewer': {'required': False}  # 设为可选
        }

    def create(self, validated_data):
        # 提取文本字段
        company_name = validated_data.pop('company_name')
        position_title = validated_data.pop('position_title')
        position_description = validated_data.pop('position_description', '')

        # 创建或获取公司
        company, created = Company.objects.get_or_create(
            name=company_name,
            defaults={
                'description': f'{company_name} - 自动创建',
                'website': ''
            }
        )

        # 创建或获取职位
        position, created = JobPosition.objects.get_or_create(
            title=position_title,
            company=company,
            defaults={
                'description': position_description or f'{position_title} - 自动创建',
                'requirements': '暂无要求信息',
                'level': '未指定',
                'salary_range': ''
            }
        )

        # 设置外键关系
        validated_data['company'] = company
        validated_data['position'] = position

        # 设置默认面试官（如果需要）
        if 'interviewer' not in validated_data:
            # 这里可以设置一个默认面试官，或者保持为null（如果模型允许）
            # 例如：validated_data['interviewer'] = User.objects.first()
            pass

        return super().create(validated_data)

    def validate(self, data):
        # 验证面试时间不能是过去的时间
        if 'scheduled_time' in data and data['scheduled_time']:
            from django.utils import timezone
            if data['scheduled_time'] < timezone.now():
                raise serializers.ValidationError("面试时间不能是过去的时间")
        return data

class InterviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = [
            'status', 'result', 'score', 'feedback', 'recording'
        ]

    def validate(self, data):
        # 如果状态变为已完成，必须上传录音
        if 'status' in data and data['status'] == 'completed':
            if not self.instance.recording_uploaded and 'recording' not in data:
                raise serializers.ValidationError("完成面试前必须上传录音")
        return data
