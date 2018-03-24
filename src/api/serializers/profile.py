from rest_framework import serializers

from api.serializers.character import NestedCharacterSerializer
from bdo.models.character import Profile


class SimpleProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'family_name')


class ExtendedProfileSerializer(SimpleProfileSerializer):
    character_set = NestedCharacterSerializer(many=True, required=False)

    class Meta(SimpleProfileSerializer.Meta):
        fields = ('id', 'family_name', 'character_set', 'preferred_roles')
