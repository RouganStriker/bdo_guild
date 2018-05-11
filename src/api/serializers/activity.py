from rest_framework import serializers

from api.serializers.mixin import BaseSerializerMixin
from bdo.models.activity import Activity


class ActivitySerializer(BaseSerializerMixin, serializers.ModelSerializer):
    description = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ('id', 'date', 'type', 'actor_profile', 'description')

    def get_description(self, instance):
        return str(instance)
