from expander import ExpanderSerializerMixin
from rest_framework import serializers

from bdo.models.content import CharacterClass, WarArea, WarNode


class CharacterClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharacterClass
        fields = '__all__'


class WarAreaSerializer(serializers.ModelSerializer):
    region = serializers.SerializerMethodField()

    class Meta:
        model = WarArea
        fields = '__all__'

    def get_region(self, area):
        return area.get_region_display()


class WarNodeSerializer(ExpanderSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = WarNode
        fields = '__all__'
        expandable_fields = {
            'area': WarAreaSerializer,
        }
