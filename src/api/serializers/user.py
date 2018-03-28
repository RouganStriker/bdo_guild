from django.contrib.auth import get_user_model
from rest_framework import serializers

from api.serializers.mixin import BaseSerializerMixin
from api.serializers.profile import SimpleProfileSerializer


class UserSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    profile = SimpleProfileSerializer()
    discord_id = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'groups', 'user_permissions', 'is_superuser', 'profile', 'discord_id')

    def get_discord_id(self, user):
        return user.username
