import django_filters

from bdo.models.war import War


class WarFilter(django_filters.FilterSet):
    date = django_filters.DateRangeFilter()

    class Meta:
        model = War
        fields = ['date']
