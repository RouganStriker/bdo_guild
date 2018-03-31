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
