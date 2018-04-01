from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.filters import MemberOrderingFilter
from api.permissions import GuildPermission
from api.serializers.activity import ActivitySerializer
from api.serializers.guild import (ExtendedGuildSerializer,
                                   SimpleGuildSerializer,
                                   GuildMemberSerializer,
                                   SimpleGuildRoleSerializer)
from api.serializers.guild_content import WarRoleSerializer
from api.views.mixin import ModelViewSet, ReadOnlyModelViewSet
from bdo.models.activity import Activity
from bdo.models.guild import Guild, GuildMember, GuildRole, WarRole


class GuildViewMixin(object):
    def get_queryset(self):
        # Filters by guild
        qs = super(GuildViewMixin, self).get_queryset()
        qs = qs.filter(guild_id=self.kwargs['guild_pk'])

        return qs


class GuildViewSet(ModelViewSet):
    queryset = Guild.objects.all()
    serializer_class = ExtendedGuildSerializer
    permission_classes = (IsAuthenticated, GuildPermission)
    include_params = ['stats', 'integrations']

    def list(self, request, *args, **kwargs):
        # Use simple serializer to limit information returned
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = SimpleGuildSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class GuildRoleViewSet(ReadOnlyModelViewSet):
    queryset = GuildRole.objects.all()
    serializer_class = SimpleGuildRoleSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = super(GuildRoleViewSet, self).get_queryset()

        return qs.filter(Q(custom_for__isnull=True) | Q(custom_for=self.kwargs['guild_pk']))


class GuildMemberViewSet(ReadOnlyModelViewSet, GuildViewMixin):
    queryset = GuildMember.objects.all()
    serializer_class = GuildMemberSerializer
    filter_backends = (MemberOrderingFilter,)
    permission_classes = (IsAuthenticated,)
    ordering_fields = ('role',)
    ordering = ('user__family_name',)
    include_params = ['stats', 'attendance', 'main_character']


class GuildActivityViewSet(ReadOnlyModelViewSet, GuildViewMixin):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = (IsAuthenticated,)
    ordering_fields = ('-date', 'id')


class WarRoleViewSet(ReadOnlyModelViewSet):
    queryset = WarRole.objects.all()
    serializer_class = WarRoleSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = super(WarRoleViewSet, self).get_queryset()

        return qs.filter(Q(custom_for__isnull=True) | Q(custom_for=self.kwargs['guild_pk']))
