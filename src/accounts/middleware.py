from django.core.urlresolvers import reverse, resolve
from django.http import HttpResponseRedirect

from bdo.models.character import Profile


class RequireFamilyNameMiddleware(object):
    """
    Middleware that checks if the currently logged in user has family name set
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated():
            url_name = resolve(request.path_info).url_name

            if url_name == 'profile':
                return self.get_response(request)

            try:
                Profile.objects.get(user=request.user)
            except Profile.DoesNotExist:
                return HttpResponseRedirect(reverse('profile'))

        return self.get_response(request)
