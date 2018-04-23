from re import compile

from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils.deprecation import MiddlewareMixin

from bdo.models.character import Profile


class RequireFamilyNameMiddleware(MiddlewareMixin):
    """
    Middleware that checks if the currently logged in user has family name set
    """

    def __init__(self, get_response=None):
        super(RequireFamilyNameMiddleware, self).__init__(get_response)

        self.exempt_urls = [
            compile(url) for url in getattr(settings, "FAMILY_NAME_EXEMPT_URLS", ())
        ]

    def process_request(self, request):
        path = request.path_info.lstrip('/')

        if any(m.match(path) for m in self.exempt_urls):
            return

        if hasattr(request, 'user') and request.user.is_authenticated() and request.path_info != '/newProfile/':
            try:
                Profile.objects.get(user=request.user)
            except Profile.DoesNotExist:
                return HttpResponseRedirect('/newProfile/')
