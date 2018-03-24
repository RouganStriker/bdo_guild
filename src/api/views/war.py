from collections import defaultdict
from enum import Enum

from django_filters import rest_framework as filters
from rest_framework.decorators import detail_route, list_route
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.status import HTTP_201_CREATED, HTTP_204_NO_CONTENT
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from api.permissions import (UserPermission,
                             WarAttendancePermission,
                             WarCallSignPermission,
                             WarPermission,
                             WarTeamPermission)
from api.serializers.war import (PlayerStatSerializer,
                                 WarSerializer,
                                 WarAttendanceSerializer,
                                 WarCallSignSerializer,
                                 WarStatSerializer,
                                 WarSubmitSerializer,
                                 WarTeamSerializer,
                                 WarTemplateSerializer)
from api.views.guild import GuildViewMixin
from bdo.models.war import War, WarAttendance, WarCallSign, WarStat, WarTeam, WarTeamSlot, WarTemplate


class WarViewSet(ModelViewSet, GuildViewMixin):
    queryset = War.objects.all()
    filter_backends = (OrderingFilter, filters.DjangoFilterBackend)
    filter_fields = {
        'date': ['year', 'month']
    }
    serializer_class = WarSerializer
    permission_classes = (IsAuthenticated, WarPermission)
    ordering = ('-date',)

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


class NestedWarViewSet(ModelViewSet):
    def get_queryset(self):
        return super(NestedWarViewSet, self).get_queryset().filter(war=self.kwargs['war_pk'])


class WarAttendanceViewSet(NestedWarViewSet):
    queryset = WarAttendance.objects.all()
    serializer_class = WarAttendanceSerializer
    permission_classes = (IsAuthenticated, WarAttendancePermission)

    def get_queryset(self):
        return super(WarAttendanceViewSet, self).get_queryset().order_by('user_profile__family_name')

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

    def get_queryset(self):
        return self.queryset.filter(attendance__war=self.kwargs['war_pk'])


class PlayerStatViewSet(ReadOnlyModelViewSet):
    queryset = WarStat.objects.all()
    filter_backends = (OrderingFilter,)
    serializer_class = PlayerStatSerializer
    permission_classes = (IsAuthenticated, UserPermission)
    ordering = ('-attendance__war__date',)

    def get_queryset(self):
        return super(PlayerStatViewSet, self).get_queryset().filter(attendance__user_profile=self.kwargs['profile_pk'])
