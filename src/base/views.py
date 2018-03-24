import os

from django.conf import settings
from django.http import HttpResponse
from django.template import Template, RequestContext
from django.views.generic import View
from knox.auth import TokenAuthentication
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class IndexView(View):
    """Render main page."""

    def get_context(self, request):
        return RequestContext(request, {
            "user": request.user
        })

    def get(self, request):
        """Return html for main application page."""
        with open(os.path.join(settings.BASE_DIR, 'static_dist/index.html'), 'r') as f:
            template = Template(f.read())

        content = template.render(self.get_context(request))

        return HttpResponse(content=content)


class ProtectedDataView(GenericAPIView):
    """Return protected data main page."""

    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Process GET request and return protected data."""

        data = {
            'data': 'THIS IS THE PROTECTED STRING FROM SERVER',
        }

        return Response(data, status=status.HTTP_200_OK)
