from django.contrib.auth import get_user_model
from django.contrib.auth import login, logout
from rest_framework.authentication import BasicAuthentication
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.viewsets import GenericViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK

from api.serializers.user import UserSerializer
from api.views.mixin import UserContextMixin


class UserLoginViewSet(UserContextMixin, GenericViewSet, ListModelMixin):
    serializer_class = UserSerializer
    authentication_classes = (BasicAuthentication,)
    queryset = get_user_model().objects.all()

    def list(self, request, *args, **kwargs):
        login(self.request, request.user)
        serializer = self.get_serializer(request.user)

        return Response(serializer.data)


class UserLogoutViewSet(UserContextMixin, GenericViewSet, CreateModelMixin):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    queryset = get_user_model().objects.all()

    def create(self, request, *args, **kwargs):
        logout(request)

        return Response(status=HTTP_200_OK)

