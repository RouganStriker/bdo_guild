from rest_framework import serializers

from api.serializers.mixin import BaseSerializerMixin
from bdo.models.stats import AggregatedGuildMemberWarStats, AggregatedGuildWarStats, AggregatedUserWarStats


class BaseAggregatedStatSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    kdr = serializers.DecimalField(max_digits=19, decimal_places=2, coerce_to_string=False)

    class Meta:
        fields = [
            'command_post',
            'death',
            'fort',
            'gate',
            'guild_master',
            'help',
            'id',
            'member',
            'mount',
            'officer',
            'placed_objects',
            'siege_weapons',
            'total_kills',
            'kdr',
        ]


class AggregatedGuildMemberWarStatsSerializer(BaseAggregatedStatSerializer):
    class Meta(BaseAggregatedStatSerializer.Meta):
        model = AggregatedGuildMemberWarStats
        fields = BaseAggregatedStatSerializer.Meta.fields + [
            'wars_attended',
            'wars_unavailable',
            'wars_missed',
            'wars_reneged'
        ]


class AggregatedGuildWarStatsSerializer(BaseAggregatedStatSerializer):
    class Meta(BaseAggregatedStatSerializer.Meta):
        model = AggregatedGuildWarStats


class AggregatedUserWarStatsSerializer(BaseAggregatedStatSerializer):
    class Meta(BaseAggregatedStatSerializer.Meta):
        model = AggregatedUserWarStats
        fields = BaseAggregatedStatSerializer.Meta.fields + [
            'wars_attended',
            'wars_unavailable',
            'wars_missed',
            'wars_reneged'
        ]
