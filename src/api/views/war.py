from collections import defaultdict
from datetime import datetime
from enum import Enum

from django.db.models import Prefetch
from django_filters import rest_framework as filters
from rest_framework.decorators import detail_route, list_route
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.status import HTTP_201_CREATED, HTTP_204_NO_CONTENT

from api.filters import CaseInsensitiveOrderingFilter
from api.permissions import (RestrictedUserPermission,
                             UserPermission,
                             WarAttendancePermission,
                             WarCallSignPermission,
                             WarPermission,
                             WarTeamPermission)
from api.serializers.war import (PlayerStatSerializer,
                                 PlayerWarSerializer,
                                 WarSerializer,
                                 WarAttendanceSerializer,
                                 WarCallSignSerializer,
                                 WarStatSerializer,
                                 WarSubmitSerializer,
                                 WarTeamSerializer,
                                 WarTemplateSerializer,
                                 WarUpdateSerializer)
from api.views.guild import GuildViewMixin
from api.views.mixin import ModelViewSet, ReadOnlyModelViewSet
from bdo.models.character import Character
from bdo.models.war import War, WarAttendance, WarCallSign, WarStat, WarTeam, WarTeamSlot, WarTemplate


class WarViewSet(ModelViewSet, GuildViewMixin):
    queryset = War.objects.all()
    filter_backends = (OrderingFilter, filters.DjangoFilterBackend)
    filter_fields = {
        'date': ['year', 'month'],
        'outcome': ['isnull']
    }
    serializer_class = WarSerializer
    permission_classes = (IsAuthenticated, WarPermission)
    ordering = ('-date',)
    include_params = ['stats']

    def get_queryset(self):
        return self.queryset.select_related('node')

    def get_serializer_context(self):
        context = super(WarViewSet, self).get_serializer_context()
        context['guild_pk'] = self.kwargs['guild_pk']

        return context

    @detail_route(methods=['post'], permission_classes=[IsAuthenticated])
    def finish(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data

        serializer = WarSubmitSerializer(data=data, context={'war': instance})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=HTTP_201_CREATED)

    @detail_route(methods=['post'], permission_classes=[IsAuthenticated])
    def update_war(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data

        serializer = WarUpdateSerializer(data=data, context={'war': instance})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=HTTP_201_CREATED)


class NestedWarViewSet(ModelViewSet):
    def get_queryset(self):
        return super(NestedWarViewSet, self).get_queryset().filter(war=self.kwargs['war_pk'])


class WarAttendanceViewSet(NestedWarViewSet):
    queryset = WarAttendance.objects.all()
    serializer_class = WarAttendanceSerializer
    permission_classes = (IsAuthenticated, WarAttendancePermission)

    def get_queryset(self):
        attendance_qs = WarAttendance.objects.filter(is_attending__in=[0, 4, 5]).order_by('-war__date')
        qs = super(WarAttendanceViewSet, self).get_queryset().order_by('user_profile__family_name')
        qs = (qs.select_related('user_profile', 'character')
                .prefetch_related(
                    Prefetch('user_profile__character_set', Character.objects.select_related('character_class')),
                    'user_profile__preferred_roles',
                    'user_profile__user_stats',
                    Prefetch('user_profile__attendance_set', attendance_qs, '_prefetched_recent_wars'),
                    'warcallsign_set',
                    'slot__team'
                )
        )

        return qs

    def get_serializer_context(self):
        context = super(WarAttendanceViewSet, self).get_serializer_context()
        context['profile'] = self.request.user.profile
        context['war_pk'] = self.kwargs['war_pk']

        return context

    @list_route(methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def me(self, request, **kwargs):
        try:
            instance = self.get_queryset().get(user_profile_id=request.user.profile.id)
        except WarAttendance.DoesNotExist:
            instance = None

        if instance is None and request.method == 'GET':
            return Response({})

        if request.method == 'GET':
            serializer_kwargs = {}
        elif instance is None:
            # POST request with no instance
            serializer_kwargs = {
                'data': request.data
            }
        else:
            # POST request with instance to update
            serializer_kwargs = {
                'data': request.data,
                'partial': True
            }

        serializer = self.get_serializer(instance, **serializer_kwargs)

        if request.method == 'POST':
            serializer.is_valid(raise_exception=True)
            serializer.save()

            if instance is None:
                return Response(serializer.data, status=HTTP_201_CREATED)

        return Response(serializer.data)


class WarTemplateViewSet(ReadOnlyModelViewSet):
    queryset = WarTemplate.objects.all()
    serializer_class = WarTemplateSerializer
    permission_classes = (IsAuthenticated,)


class WarTeamViewSet(NestedWarViewSet):
    queryset = WarTeam.objects.all()
    serializer_class = WarTeamSerializer
    permission_classes = (IsAuthenticated, WarTeamPermission)

    class Messages(Enum):
        MISSING_FIELD = u"This field is required."
        INVALID_SLOT = u"Invalid slot."
        INVALID_ATTENDEE = u"Invalid attendee_id"

    def get_queryset(self):
        prefetch_members = Prefetch('members', WarAttendance.objects.select_related('slot'))

        return (super(WarTeamViewSet, self).get_queryset()
                                           .select_related('default_role')
                                           .prefetch_related(prefetch_members))

    def get_serializer_context(self):
        context = super(WarTeamViewSet, self).get_serializer_context()
        context['war_pk'] = self.kwargs['war_pk']

        return context

    @detail_route(methods=['post'], permission_classes=[IsAuthenticated])
    def set_slot(self, request, *args, **kwargs):
        data = request.data
        team = self.get_object()
        errors = defaultdict(list)

        for field in ['slot', 'attendee_id']:
            if field not in data:
                errors[field].append(self.Messages.MISSING_FIELD.value)
        if errors:
            raise ValidationError(errors)

        if data['slot'] < 1 or data['slot'] > team.max_slots:
            raise ValidationError({'slot': self.Messages.INVALID_SLOT.value})

        if data['attendee_id'] is not None:
            try:
                attendee = WarAttendance.objects.get(id=data['attendee_id'])
            except WarAttendance.DoesNotExist:
                raise ValidationError({'attendee_id': self.Messages.INVALID_ATTENDEE.value})

            WarTeamSlot.objects.update_or_create(defaults={'attendee': attendee}, team=team, slot=data['slot'])
        else:
            WarTeamSlot.objects.filter(team=team, slot=data['slot']).delete()

        return Response(status=HTTP_204_NO_CONTENT)


class WarCallSignViewSet(NestedWarViewSet):
    queryset = WarCallSign.objects.all()
    serializer_class = WarCallSignSerializer
    permission_classes = (IsAuthenticated, WarCallSignPermission)

    class Messages(Enum):
        MISSING_FIELD = u"This field is required."
        INVALID_SLOT = u"Invalid slot."
        INVALID_ATTENDEE = u"Invalid attendee_id"

    def get_queryset(self):
        return super(WarCallSignViewSet, self).get_queryset().prefetch_related('members')

    def get_serializer_context(self):
        context = super(WarCallSignViewSet, self).get_serializer_context()
        context['war_pk'] = self.kwargs['war_pk']

        return context

    @detail_route(methods=['post'], permission_classes=[IsAuthenticated])
    def assign(self, request, *args, **kwargs):
        data = request.data

        if 'attendee_id' not in data:
            raise ValidationError({'attendee_id': [self.Messages.MISSING_FIELD]})

        try:
            attendee = WarAttendance.objects.get(id=data['attendee_id'])
        except WarAttendance.DoesNotExist:
            raise ValidationError({'attendee_id': self.Messages.INVALID_ATTENDEE.value})

        self.get_object().members.add(attendee)

        return Response(status=HTTP_204_NO_CONTENT)

    @detail_route(methods=['post'], permission_classes=[IsAuthenticated])
    def unassign(self, request, *args, **kwargs):
        data = request.data
        call_sign = self.get_object()

        if 'attendee_id' not in data:
            raise ValidationError({'attendee_id': [self.Messages.MISSING_FIELD]})

        try:
            attendee = call_sign.members.get(id=data['attendee_id'])
        except WarAttendance.DoesNotExist:
            raise ValidationError({'attendee_id': self.Messages.INVALID_ATTENDEE.value})

        call_sign.members.remove(attendee)

        return Response(status=HTTP_204_NO_CONTENT)


class WarStatViewSet(ReadOnlyModelViewSet):
    queryset = WarStat.objects.all()
    serializer_class = WarStatSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = (CaseInsensitiveOrderingFilter,)
    ordering_fields = ('id', 'attendance__user_profile__family_name')

    def get_queryset(self):
        return self.queryset.filter(attendance__war=self.kwargs['war_pk']).select_related('attendance__user_profile',
                                                                                          'attendance__character')


class PlayerStatViewSet(ReadOnlyModelViewSet):
    queryset = WarStat.objects.all()
    filter_backends = (OrderingFilter,)
    serializer_class = PlayerStatSerializer
    permission_classes = (IsAuthenticated, RestrictedUserPermission)
    ordering = ('-attendance__war__date',)

    def get_queryset(self):
        return (super(PlayerStatViewSet, self).get_queryset()
                                              .filter(attendance__user_profile=self.kwargs['profile_pk'])
                                              .select_related('attendance__war__guild'))


class PlayerWarViewSet(ReadOnlyModelViewSet):
    queryset = War.objects.all()
    serializer_class = PlayerWarSerializer
    permission_classes = (IsAuthenticated, RestrictedUserPermission)
    ordering = ('-date',)
    boolean_params = ('active',)

    def get_queryset(self):
        prefetch_attendance = Prefetch('attendance_set',
                                       WarAttendance.objects.filter(user_profile=self.request.user.profile),
                                       'my_attendance')
        qs = (super(PlayerWarViewSet, self).get_queryset()
                                           .filter(guild__members__id=self.kwargs['profile_pk'])
                                           .prefetch_related(prefetch_attendance, 'warcallsign_set', 'warteam_set')
              )

        if self.get_serializer_context()['boolean']['active']:
            qs = qs.filter(outcome__isnull=True, date__gte=datetime.now())

        return qs
