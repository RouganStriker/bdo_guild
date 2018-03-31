import django_filters
import re
from django.db.models import Case, ExpressionWrapper, F, IntegerField, OuterRef, Subquery, Value, When
from django.db.models.functions import Coalesce
from rest_framework.filters import OrderingFilter

from bdo.models.character import Character
from bdo.models.war import War


class WarFilter(django_filters.FilterSet):
    date = django_filters.DateRangeFilter()

    class Meta:
        model = War
        fields = ['date']


class MemberOrderingFilter(OrderingFilter):
    def get_ordering(self, request, queryset, view):
        params = request.query_params.get(self.ordering_param)

        if params:
            fields = [param.strip() for param in params.split(',')]
            char_qs = Character.objects.filter(is_main=True, id=OuterRef('pk'))
            gearscore_expression = Case(
                When(ap__lt=F('aap'), then=ExpressionWrapper(F('aap') + F('dp'), output_field=IntegerField())),
                default=ExpressionWrapper(F('ap') + F('dp'), output_field=IntegerField()),
            )
            ordering = []
            # Special Ordering
            for field in fields:
                if field == 'name':
                    ordering.append('user__family_name')
                elif field == '-name':
                    ordering.append('-user__family_name')
                elif re.match('^-?level$', field):
                    qs = qs.annotate(level=Coalesce(Subquery(char_qs.values('level')[:1]), 0))
                    ordering.append(field)
                elif re.match('^-?className', field):
                    qs = qs.annotate(className=Coalesce(Subquery(char_qs.values('character_class__name')[:1]), Value('')))
                    ordering.append(field)
                elif re.match('^-?gearscore$', field):
                    qs = qs.annotate(gearscore=Coalesce(
                        Subquery(char_qs.annotate(gearscore=gearscore_expression).values('gearscore')[:1],
                                 output_field=IntegerField()), 0))
                    ordering.append(field)
                else:
                    ordering.append(field)

            if ordering:
                return ordering

        return self.get_default_ordering(view)

    def filter_queryset(self, request, queryset, view):
        params = request.query_params.get(self.ordering_param)

        if params:
            fields = [param.strip() for param in params.split(',')]
            char_qs = Character.objects.filter(is_main=True, profile=OuterRef('user_id'))
            gearscore_expression = Case(
                When(ap__lt=F('aap'), then=ExpressionWrapper(F('aap') + F('dp'), output_field=IntegerField())),
                default=ExpressionWrapper(F('ap') + F('dp'), output_field=IntegerField()),
            )
            ordering = []

            # Special Ordering
            for field in fields:
                if field == 'name':
                    ordering.append('user__family_name')
                elif field == '-name':
                    ordering.append('-user__family_name')
                elif re.match('^-?level$', field):
                    queryset = queryset.annotate(level=Coalesce(Subquery(char_qs.values('level')[:1]), 0))
                    ordering.append(field)
                elif re.match('^-?className', field):
                    queryset = queryset.annotate(
                        className=Coalesce(Subquery(char_qs.values('character_class__name')[:1]), Value('')))
                    ordering.append(field)
                elif re.match('^-?gearscore$', field):
                    queryset = queryset.annotate(gearscore=Coalesce(
                        Subquery(char_qs.annotate(gearscore=gearscore_expression).values('gearscore')[:1],
                                 output_field=IntegerField()), 0))
                    ordering.append(field)
                else:
                    ordering.append(field)
        else:
            ordering = self.get_default_ordering(view)

        if ordering:
            return queryset.order_by(*ordering)

        return queryset
