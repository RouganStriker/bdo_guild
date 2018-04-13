from django.db import models


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


class AggregatedUserWarStats(BaseAggregatedWarStats):
    user_profile = models.OneToOneField("Profile", related_name="user_stats", unique=True)
    wars_attended = models.IntegerField(default=0)
    wars_unavailable = models.IntegerField(default=0)
    wars_missed = models.IntegerField(default=0)

    def __str__(self):
        return "{0}'s stats".format(self.user_profile)


class AggregatedGuildWarStats(BaseAggregatedWarStats):
    guild = models.OneToOneField("Guild", related_name="guild_stats", unique=True)

    def __str__(self):
        return "[{0}] guild's stats".format(self.guild)


class AggregatedGuildMemberWarStats(BaseAggregatedWarStats):
    guild = models.ForeignKey("Guild")
    user_profile = models.ForeignKey("Profile")
    wars_attended = models.IntegerField(default=0)
    wars_unavailable = models.IntegerField(default=0)
    wars_missed = models.IntegerField(default=0)

    class Meta:
        unique_together = ('guild', 'user_profile')

    def __str__(self):
        return "[{0}] {1}'s stats".format(self.guild, self.user_profile)
