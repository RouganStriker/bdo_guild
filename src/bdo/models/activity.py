from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.db import models

from bdo.utils import ChoicesEnum


class Activity(models.Model):
    TYPES = ChoicesEnum(
        "TYPES",
        (
            "GUILD_CREATE",     # UNUSED
            # General guild detail changes
            "GUILD_UPDATE",
            # Discord integration changes
            "GUILD_UPDATE_INTEGRATION",
            "GUILD_DELETE",     # UNUSED
            "WAR_CREATE",
            # General war detail changes
            "WAR_UPDATE",
            "WAR_DELETE",
            # Finish war
            "WAR_END",
            # Attendance change by officer or higher
            "ATTENDANCE_UPDATE",
            # Stat Changes
            "WAR_STAT_CREATE",
            "WAR_STAT_DELETE",
            "WAR_STAT_UPDATE",
        )
    )

    date = models.DateTimeField(auto_now_add=True)
    type = models.IntegerField(choices=TYPES.choices())
    guild = models.ForeignKey("Guild", null=True, blank=True)
    actor_profile = models.ForeignKey("Profile")
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey('content_type', 'object_id')
    # Populated when target object is deleted
    target_description = models.CharField(max_length=255, null=True, blank=True)
    extras = JSONField(default={})

    class Meta:
        ordering = ('-date', 'id')

    def __str__(self):
        methodname = 'format_{0}'.format(self.TYPES._value2member_map_[self.type].name.lower())

        if hasattr(self, methodname):
            return getattr(self, methodname)()

        return str(self.type)

    def format_guild_create(self):
        return "{0} created the guild {1}".format(self.actor_profile, self.target_description)

    def format_guild_update(self):
        return "{0} updated the guild {1}".format(self.actor_profile, self.target_description)

    def format_guild_update_integration(self):
        return "{0} updated integration settings for the guild {1}".format(self.actor_profile, self.target_description)

    def format_guild_delete(self):
        return "{0} deleted the guild {1}".format(self.actor_profile, self.target_description)

    def format_war_create(self):
        return "{0} started a war".format(self.actor_profile)

    def format_war_update(self):
        return "{0} updated war details".format(self.actor_profile)

    def format_war_delete(self):
        return "{0} cancelled the war {1}".format(self.actor_profile, self.target_description)

    def format_war_end(self):
        return "{0} finished the war".format(self.actor_profile)

    def format_war_stat_create(self):
        return "{0} created war stat for {1}".format(self.actor_profile, self.target_description)

    def format_war_stat_delete(self):
        return "{0} deleted war stat for {1}".format(self.actor_profile, self.target_description)

    def format_war_stat_update(self):
        return "{0} updated war stat for {1}".format(self.actor_profile, self.target_description)

    def format_attendance_update(self):
        return "{0} updated attendance for {1}".format(self.actor_profile, self.target)
