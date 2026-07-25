from rest_framework import serializers
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('timezone', 'language', 'theme', 'notification_email', 'notification_in_app')


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'avatar', 'phone', 'bio', 'is_active', 'is_verified',
            'created_at', 'updated_at', 'profile',
        )
        read_only_fields = ('id', 'email', 'role', 'is_active', 'is_verified', 'created_at', 'updated_at')


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'avatar', 'is_active', 'is_verified', 'created_at')


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    timezone = serializers.CharField(max_length=50, required=False)
    language = serializers.CharField(max_length=10, required=False)
    theme = serializers.ChoiceField(choices=['light', 'dark', 'system'], required=False)
    notification_email = serializers.BooleanField(required=False)
    notification_in_app = serializers.BooleanField(required=False)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role = serializers.ChoiceField(choices=['developer', 'company_manager', 'employee'])
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        from .models import User
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value.lower()