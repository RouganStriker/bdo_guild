from django.db.models import Case, F, FloatField, Prefetch, Q, Sum, Value, When
from django.db.models.fields import IntegerField
from django.db.models.functions import Coalesce
from rest_framework import filters
from rest_framework.decorators import detail_route, list_route
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.filters import MemberOrderingFilter
from api.permissions import GuildPermission, GuildMemberExportPermission, GuildOfficerPermission
from api.serializers.activity import ActivitySerializer
from api.serializers.guild import (ExtendedGuildSerializer,
                                   SimpleGuildSerializer,
                                   GuildMemberSerializer,
                                   SimpleGuildRoleSerializer)
from api.serializers.guild_content import WarRoleSerializer
from api.views.mixin import CSVExportMixin, ModelViewSet, ReadOnlyModelViewSet
from bdo.models.activity import Activity
from bdo.models.character import Character
from bdo.models.content import WarNode
from bdo.models.guild import Guild, GuildMember, GuildRole
from bdo.models.war import WarAttendance, WarRole
from bdo.models.stats import AggregatedGuildMemberWarStats


class GuildViewMixin(GenericAPIView):
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

    @detail_route(methods=['get'], permission_classes=[GuildOfficerPermission])
    def attendance_estimate(self, request, *args, **kwargs):
        """
        Return a count of pre-signed up members for each war day.
        """
        guild = self.get_object()
        days = WarNode.DAY_CHOICES
        annotations = {
            day: Case(
                    When(**{
                        "user__availability__{}".format(day): 0,
                        "then": Value(1)
                    }),
                    default=Value(0),
                    output_field=IntegerField()
                 )
            for _, day in days
        }
        aggregates = {
            str(day_id): Coalesce(Sum(day_name), Value(0))
            for day_id, day_name in days
        }

        qs = (
            GuildMember.objects.filter(guild=guild, user__auto_sign_up=True)
                       .annotate(**annotations)
                       .aggregate(**aggregates)
        )

        return Response(qs)


class GuildRoleViewSet(ReadOnlyModelViewSet):
    queryset = GuildRole.objects.all()
    serializer_class = SimpleGuildRoleSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = super(GuildRoleViewSet, self).get_queryset()

        return qs.filter(Q(custom_for__isnull=True) | Q(custom_for=self.kwargs['guild_pk']))


class GuildMemberViewSet(ReadOnlyModelViewSet, GuildViewMixin, CSVExportMixin):
    queryset = GuildMember.objects.all()
    serializer_class = GuildMemberSerializer
    filter_backends = (MemberOrderingFilter, filters.SearchFilter)
    permission_classes = (IsAuthenticated,)
    ordering_fields = ('role',)
    ordering = ('user__family_name',)
    search_fields = ('user__family_name',)
    include_params = ['stats', 'attendance', 'main_character']
    CSV_FILE_NAME = 'members.csv'

    def get_queryset(self):
        qs = super(GuildMemberViewSet, self).get_queryset()
        character_qs = Character.objects.select_related('character_class')
        qs = qs.prefetch_related(Prefetch('user__character_set', character_qs))
        qs = qs.select_related('user__user')

        guild_id = self.kwargs['guild_pk']
        includes = self.get_serializer_context()['include']
        ordering = self.request.query_params.get(MemberOrderingFilter.ordering_param)

        if 'attendance' in includes:
            attendance_qs = (WarAttendance.objects.filter(war__guild_id=guild_id, war__outcome__isnull=False)
                                                  .order_by('-war__date')
                                                  .select_related('war'))
            attendance_prefetch = Prefetch('user__attendance_set', attendance_qs, '_prefetched_attendance')
            qs = qs.select_related('guild', 'role')
            qs = qs.prefetch_related(attendance_prefetch)
        if 'role' in self.request.query_params.get('expand', []):
            qs = qs.select_related('role')
        if 'user' in self.request.query_params.get('expand', []):
            qs = qs.prefetch_related('user__preferred_roles')
        if 'stats' in includes:
            stats_prefetch = Prefetch('user__aggregatedmemberstats',
                                      AggregatedGuildMemberWarStats.objects.filter(guild=guild_id),
                                      'member_stats')
            qs = qs.prefetch_related(stats_prefetch)
        if 'stats' in includes or ordering and 'attendance_rate' in ordering:
            attended = F('user__aggregatedmemberstats__wars_attended')
            unavailable = F('user__aggregatedmemberstats__wars_unavailable')
            missed = F('user__aggregatedmemberstats__wars_missed')
            attendance_rate_expr = Case(
                When(user__aggregatedmemberstats__wars_attended=0,
                     user__aggregatedmemberstats__wars_unavailable=0,
                     user__aggregatedmemberstats__wars_missed=0,
                     then=0.0),
                default=((attended + unavailable * 0.5) / (attended + unavailable + missed)),
                output_field=FloatField()
            )
            qs = (qs.filter(user__aggregatedmemberstats__guild_id=guild_id)
                    .annotate(_prefetched_attendance_rate=attendance_rate_expr))

        return qs

    @list_route(methods=['get'], permission_classes=[IsAuthenticated, GuildMemberExportPermission])
    def export(self, request, **kwargs):
        """
        Override the base export to require extra permissions
        """
        return super(GuildMemberViewSet, self).export(request, **kwargs)


class GuildActivityViewSet(ReadOnlyModelViewSet, GuildViewMixin):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = (IsAuthenticated,)
    ordering_fields = ('-date', 'id')

    def get_queryset(self):
        qs = super(GuildActivityViewSet, self).get_queryset()

        return qs.select_related('actor_profile', 'guild')


class WarRoleViewSet(ReadOnlyModelViewSet):
    queryset = WarRole.objects.all()
    serializer_class = WarRoleSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = super(WarRoleViewSet, self).get_queryset()

        return qs.filter(Q(custom_for__isnull=True) | Q(custom_for=self.kwargs['guild_pk']))
