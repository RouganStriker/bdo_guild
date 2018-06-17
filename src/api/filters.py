import django_filters
import re
from django.db.models import Case, ExpressionWrapper, F, IntegerField, OuterRef, Subquery, Value, When
from django.db.models.functions import Coalesce, Lower
from rest_framework.filters import OrderingFilter

from bdo.models.character import Character
from bdo.models.war import War


class WarFilter(django_filters.FilterSet):
    date = django_filters.DateRangeFilter()

    class Meta:
        model = War
        fields = ['date']


class CaseInsensitiveOrderingFilter(OrderingFilter):

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)

        if ordering:
            new_ordering = []
            for field in ordering:
                if field.startswith('-'):
                    new_ordering.append(Lower(field[1:]).desc())
                else:
                    new_ordering.append(Lower(field).asc())
            return queryset.order_by(*new_ordering)

        return queryset


class MemberOrderingFilter(OrderingFilter):
    stat_ordering_fields = [
        'command_post',
        'fort',
        'gate',
        'help',
        'mount',
        'placed_objects',
        'guild_master',
        'officer',
        'member',
        'death',
        'siege_weapons',
        'total_kills',
        'kdr'
    ]
    stat_ordering_fields_regex = re.compile('^-?({0})'.format("|".join(stat_ordering_fields)))
    custom_ordering_fields = ['level', 'className', 'gearscore', 'attendance_rate'] + stat_ordering_fields
    custom_ordering_field_regex = re.compile('^-?({0})'.format("|".join(custom_ordering_fields)))

    def get_ordering(self, request, queryset, view):
        params = request.query_params.get(self.ordering_param)

        if params:
            fields = [param.strip() for param in params.split(',')]
            ordering = []

            # Special Ordering
            for field in fields:
                if field == 'name':
                    ordering.append('user__family_name')
                elif field == '-name':
                    ordering.append('-user__family_name')
                elif self.custom_ordering_field_regex.match(field):
                    ordering.append(field)

            if ordering:
                return ordering

        return self.get_default_ordering(view)

    def filter_queryset(self, request, queryset, view):
        params = request.query_params.get(self.ordering_param)
        guild_pk = int(request.parser_context['kwargs']['guild_pk'])

        if params:
            fields = [param.strip() for param in params.split(',')]
            char_qs = Character.objects.filter(is_main=True, profile=OuterRef('user_id'))
            gearscore_expression = (F('ap') + F('aap'))/2 + F('dp') + F('profile__npc_renown')
            ordering = []

            # Special Ordering
            for field in fields:
                if re.match('^-?name', field):
                    ordering.append(field.replace("name", "user__family_name"))
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
                elif re.match('^-?attendance_rate', field):
                    # Prefetching is done in viewset
                    ordering.append(field.replace('attendance_rate', '_prefetched_attendance_rate'))
                elif re.match(self.stat_ordering_fields_regex, field):
                    queryset = queryset.filter(user__aggregatedmemberstats__guild_id=guild_pk)
                    ordering.append(re.sub(r'({0})'.format("|".join(self.stat_ordering_fields)),
                                           r'user__aggregatedmemberstats__\1',
                                           field))
                else:
                    ordering.append(field)
        else:
            ordering = self.get_default_ordering(view)

        if ordering:
            return queryset.order_by(*ordering)

        return queryset
