from bdo.context import UserContext
from rest_framework.viewsets import (ModelViewSet as DRFModelViewSet,
                                     ReadOnlyModelViewSet as DRFReadOnlyModelViewSet)


class FilterMixin(object):
    """
    Contains basic view helpers like include and exclude query params.
    """
    include_params = []
    exclude_params = []

    def get_serializer_context(self):
        context = super(FilterMixin, self).get_serializer_context()
        query = context['request'].query_params

        context['include'] = []
        context['exclude'] = []

        if 'include' in query:
            context['include'] = [param for param in query['include'].split(',') if param in self.include_params]
        if 'exclude' in query:
            context['exclude'] = [param for param in query['exclude'].split(',') if param in self.exclude_params]

        return context


class UserContextMixin(object):
    """
    Open a UserContext when processing a user request.

    This allows us to track which user is making changes at the model level.
    """

    def initial(self, request, *args, **kwargs):
        self.user_context = UserContext(request.user)
        self.user_context.open()
        super(UserContextMixin, self).initial(request, *args, **kwargs)

    def finalize_response(self, request, response, *args, **kwargs):
        if hasattr(self, 'user_context') and self.user_context.is_open:
            self.user_context.close()
        return super(UserContextMixin, self).finalize_response(request, response, *args, **kwargs)

    def handle_exception(self, exc):
        if hasattr(self, 'user_context'):
            self.user_context.close()
        return super(UserContextMixin, self).handle_exception(exc)


class ModelViewSet(FilterMixin, UserContextMixin, DRFModelViewSet):
    pass


class ReadOnlyModelViewSet(FilterMixin, UserContextMixin, DRFReadOnlyModelViewSet):
    pass
