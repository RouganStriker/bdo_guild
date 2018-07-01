from rest_framework import serializers

from api.serializers.character import NestedCharacterSerializer
from api.serializers.mixin import BaseSerializerMixin
from bdo.models.character import Profile


class SimpleProfileSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'family_name')


class ExtendedProfileSerializer(SimpleProfileSerializer):
    character_set = NestedCharacterSerializer(many=True, required=False)

    class Meta(SimpleProfileSerializer.Meta):
        fields = ('id', 'family_name', 'region', 'npc_renown', 'character_set', 'preferred_roles')
