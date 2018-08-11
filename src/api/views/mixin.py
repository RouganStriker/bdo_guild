import csv

from django.http import StreamingHttpResponse
from rest_framework.decorators import list_route
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import (ModelViewSet as DRFModelViewSet,
                                     ReadOnlyModelViewSet as DRFReadOnlyModelViewSet)

from bdo.context import UserContext


class FilterMixin(object):
    """
    Contains basic view helpers like include and exclude query params.
    """
    include_params = []
    exclude_params = []
    boolean_params = []

    def get_serializer_context(self):
        context = super(FilterMixin, self).get_serializer_context()
        query = context['request'].query_params

        context['include'] = []
        context['exclude'] = []
        context['boolean'] = {}

        if 'include' in query:
            context['include'] = [param for param in query['include'].split(',') if param in self.include_params]
        if 'exclude' in query:
            context['exclude'] = [param for param in query['exclude'].split(',') if param in self.exclude_params]
        for param in self.boolean_params:
            context['boolean'][param] = param in query

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


class CSVExportMixin(object):
    """
    Add an export endpoint that returns the data in a CSV format.
    """
    CSV_FILE_NAME = 'export.csv'

    class Echo:
        """An object that implements just the write method of the file-like
        interface.
        """

        def write(self, value):
            """Write the value by returning it, instead of storing in a buffer."""
            return value

    def generate_csv(self, objects):
        """
        Return an iterator for csv file.
        """
        buffer = self.Echo()
        writer = csv.writer(buffer)
        found_header = False
        rows = []

        if not objects:
            return ''

        for obj in objects:
            serializer = self.get_serializer(obj)

            if hasattr(serializer, 'for_csv'):
                data = serializer.for_csv()
            else:
                # Try to serializer the data automatically
                data = serializer.data

            if not found_header:
                rows.append(list(data.keys()))
                found_header = True

            rows.append([str(value) for value in data.values()])

        return (writer.writerow(row) for row in rows)

    @list_route(methods=['get'], permission_classes=[IsAuthenticated])
    def export(self, request, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            objects = page
        else:
            objects = queryset

        response = StreamingHttpResponse(self.generate_csv(objects), content_type="text/csv")
        response['Content-Disposition'] = 'attachment; filename={0}'.format(self.CSV_FILE_NAME)

        return response
