from django.db import models
from django.db.models import Case, IntegerField, Sum, When

from bdo.models.war import WarAttendance, WarStat


class BaseAggregatedWarStats(models.Model):
    command_post = models.IntegerField(default=0)
    fort = models.IntegerField(default=0)
    gate = models.IntegerField(default=0)
    help = models.IntegerField(default=0)
    mount = models.IntegerField(default=0)
    placed_objects = models.IntegerField(default=0)
    guild_master = models.IntegerField(default=0)
    officer = models.IntegerField(default=0)
    member = models.IntegerField(default=0)
    death = models.IntegerField(default=0)
    siege_weapons = models.IntegerField(default=0)
    total_kills = models.IntegerField(default=0)
    kdr = models.FloatField(default=0.0)

    class Meta:
        abstract = True

    @property
    def base_stat_fields(self):
        return [
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
            'siege_weapons'
        ]

    def recalculate_total_kills(self):
        self.total_kills = self.guild_master + self.officer + self.member + self.siege_weapons

    def recalculate_kdr(self):
        if self.death == 0:
            self.kdr = 0.0
        else:
            self.kdr = self.total_kills * 1.0 / self.death

    def war_stat_qs(self):
        """WarStat query used when recalcuating."""
        raise NotImplementedError()

    def recalculate(self, save=True):
        stats = self.war_stat_qs().annotate(**{
            field: models.Sum(field)
            for field in self.base_stat_fields
        }).values(*self.base_stat_fields)

        if stats:
            stats = stats[0]
            for field, value in stats.items():
                setattr(self, field.strip('_'), value)

            self.recalculate_total_kills()
            self.recalculate_kdr()

        if save:
            self.save()


class BaseUserAggregatedWarStats(BaseAggregatedWarStats):
    user_profile = models.OneToOneField("Profile", related_name="user_stats", unique=True)
    wars_attended = models.IntegerField(default=0)
    wars_unavailable = models.IntegerField(default=0)
    wars_missed = models.IntegerField(default=0)

    class Meta:
        abstract = True

    def clone_and_increment(self, war_stat, is_attending):
        """
        Helper method for bulk re-creating aggregated stats.
        """
        new_obj = self
        new_obj.pk = None
        new_obj.id = None

        if war_stat is not None:
            for field in self.base_stat_fields:
                current = getattr(new_obj, field)
                setattr(new_obj, field, current + getattr(war_stat, field))
            # Re-calculate total kills and kdr
            self.recalculate_total_kills()
            self.recalculate_kdr()

        if is_attending in [0, 4]:
            new_obj.wars_attended += 1
            print(new_obj.__dict__)
        elif is_attending == 1:
            new_obj.wars_unavailable += 1
        else:
            new_obj.wars_missed += 1

        return new_obj

    def attendance_qs(self):
        """WarAttendance filters"""
        raise NotImplementedError()

    def recalculate(self, save=True):
        # Re-calculate attendance
        super(BaseUserAggregatedWarStats, self).recalculate(save=False)

        attendance = self.attendance_qs().annotate(
            wars_attended=Sum(Case(When(is_attending__in=[0, 4], then=1), default=0), output_field=IntegerField()),
            wars_unavailable=Sum(Case(When(is_attending=1, then=1), default=0), output_field=IntegerField()),
            wars_missed=Sum(Case(When(is_attending=3, then=1), default=0), output_field=IntegerField()),
        ).values('wars_attended', 'wars_unavailable', 'wars_missed')

        if attendance:
            attendance = attendance[0]
            self.wars_attended = attendance['wars_attended']
            self.wars_unavailable = attendance['wars_unavailable']
            self.wars_missed = attendance['wars_missed']

        self.save()


class AggregatedGuildWarStats(BaseAggregatedWarStats):
    guild = models.OneToOneField("Guild", related_name="guild_stats", unique=True)

    def __str__(self):
        return "[{0}] guild's stats".format(self.guild)

    @staticmethod
    def update(guild, stats):
        if not stats:
            return

        stats["total_kills"] = stats["guild_master"] + stats["officer"] + stats["member"] + stats["siege_weapons"]

        try:
            aggregated_stat = AggregatedGuildWarStats.objects.get(guild=guild)
        except AggregatedGuildWarStats.DoesNotExist():
            stats["kdr"] = stats["total_kills"] * 1.0 / stats["death"]
            AggregatedGuildWarStats.objects.create(guild=guild, *stats)
            return

        for stat_field, stat_value in stats.items():
            current = getattr(aggregated_stat, stat_field)
            setattr(aggregated_stat, stat_field, current + stat_value)

        aggregated_stat.kdr = aggregated_stat.total_kills * 1.0 / aggregated_stat.death

        aggregated_stat.save()

    def war_stat_qs(self):
        return (WarStat.objects.values('attendance__war__guild')
                               .order_by('attendance__war__guild')
                               .filter(attendance__war__guild=self.guild))


class AggregatedUserWarStats(BaseUserAggregatedWarStats):
    def __str__(self):
        return "{0}'s stats".format(self.user_profile)

    def war_stat_qs(self):
        return (WarStat.objects.values('attendance__user_profile')
                               .order_by('attendance__user_profile')
                               .filter(attendance__user_profile=self.user_profile))

    def attendance_qs(self):
        return (WarAttendance.objects.values('user_profile')
                                     .order_by('user_profile')
                                     .filter(user_profile=self.user_profile))

    def attendance_filters(self):
        return {"user_profile": self.user_profile}


class AggregatedGuildMemberWarStats(BaseUserAggregatedWarStats):
    guild = models.ForeignKey("Guild")
    user_profile = models.ForeignKey("Profile")

    class Meta:
        unique_together = ('guild', 'user_profile')

    def __str__(self):
        return "[{0}] {1}'s stats".format(self.guild, self.user_profile)

    def war_stat_qs(self):
        return (WarStat.objects.values('attendance__war__guild', 'attendance__user_profile')
                               .order_by('attendance__war__guild', 'attendance__user_profile')
                               .filter(attendance__war__guild=self.guild,
                                       attendance__user_profile=self.user_profile))

    def attendance_qs(self):
        return (WarAttendance.objects.values('war__guild', 'user_profile')
                                     .order_by('war__guild', 'user_profile')
                                     .filter(war__guild=self.guild,
                                             user_profile=self.user_profile))
