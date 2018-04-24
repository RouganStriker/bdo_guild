from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from django_filters import rest_framework as filters
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from api.permissions import CharacterPermission, ProfilePermission, UserPermission
from api.serializers.character import CharacterSerializer, ProfileSerializer
from api.serializers.user import UserSerializer
from api.views.mixin import ModelViewSet, UserContextMixin
from bdo.models.character import Character, Profile


class CurrentUserViewSet(UserContextMixin, RetrieveAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, UserPermission)

    def get_object(self):
        return self.request.user


class CharacterViewSet(ModelViewSet):
    queryset = Character.objects.all()
    serializer_class = CharacterSerializer
    permission_classes = (IsAuthenticated, CharacterPermission)
    filter_backends = (filters.DjangoFilterBackend,)
    filter_fields = ('profile',)


class ProfileViewSet(ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated, ProfilePermission)

    def get_serializer_context(self):
        context = super(ProfileViewSet, self).get_serializer_context()

        return context

    def get_queryset(self):
        qs = super(ProfileViewSet, self).get_queryset()
        qs = qs.select_related('user_stats')
        qs = qs.prefetch_related(Prefetch('character_set', Character.objects.select_related('character_class')),
                                 'preferred_roles')

        return qs
