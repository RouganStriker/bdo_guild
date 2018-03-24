from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated

from api.serializers.content import CharacterClassSerializer, WarNodeSerializer
from bdo.models.content import CharacterClass, WarNode


class CharacterClassViewSet(ReadOnlyModelViewSet):
    queryset = CharacterClass.objects.all()
    serializer_class = CharacterClassSerializer
    permission_classes = (IsAuthenticated,)
    ordering = ('name',)


class WarNodeViewSet(ReadOnlyModelViewSet):
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filter_fields = ('war_day',)
    queryset = WarNode.objects.all()
    serializer_class = WarNodeSerializer
    permission_classes = (IsAuthenticated,)
    ordering = ('tier', 'name')

