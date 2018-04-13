from logging import getLogger

from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver

from bdo.context import UserContext
from bdo.models.activity import Activity
from bdo.models.character import Profile
from bdo.models.guild import Guild, GuildMember
from bdo.models.stats import (AggregatedGuildMemberWarStats,
                              AggregatedGuildWarStats,
                              AggregatedUserWarStats)
from bdo.models.war import War, WarAttendance, WarStat, war_finish

logger = getLogger('bdo')


# Guild Signals
@receiver(post_save, sender=Guild)
def handle_guild_save(created, instance, update_fields, *args, **kwargs):
    if not UserContext.has_current:
        return
    if created:
        type = Activity.TYPES.GUILD_CREATE.value
        AggregatedGuildWarStats.objects.create(guild=instance)
    else:
        type = Activity.TYPES.GUILD_UPDATE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance)

    if not created and set(update_fields) & {'discord_id', 'discord_roles'}:
        # Track integration updates
        Activity.objects.create(type=Activity.TYPES.GUILD_UPDATE_INTEGRATION.value,
                                actor_profile=UserContext.current.user.profile,
                                guild=instance)


@receiver(pre_delete, sender=Guild)
def handle_guild_delete(instance, *args, **kwargs):
    if not UserContext.has_current:
        return
    type = Activity.TYPES.GUILD_DELETE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            target_description=str(instance))


# War Signals
@receiver(post_save, sender=War)
def handle_war_save(created, instance, *args, **kwargs):
    if not UserContext.has_current:
        return
    if created:
        type = Activity.TYPES.WAR_CREATE.value
        instance.notify_war_start()
    else:
        type = Activity.TYPES.WAR_UPDATE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.guild,
                            target=instance)


@receiver(pre_delete, sender=War)
def handle_war_delete(instance, *args, **kwargs):
    if not UserContext.has_current:
        return

    instance.notify_war_cancelled()
    type = Activity.TYPES.WAR_DELETE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.guild,
                            target_description=str(instance))


@receiver(war_finish)
def handle_war_finish(instance, *args, **kwargs):
    if not UserContext.has_current:
        return
    type = Activity.TYPES.WAR_END.value

    instance.notify_war_finished()
    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.guild,
                            target=instance)


@receiver(post_save, sender=WarAttendance)
def handle_war_attendance_change(instance, update_fields, *args, **kwargs):
    if (update_fields is not None and 'is_attending' not in update_fields) or not UserContext.has_current:
        return

    # Track attendance changes
    type = Activity.TYPES.ATTENDANCE_UPDATE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.war.guild,
                            extras={'is_attending': instance.is_attending},
                            target=instance)


@receiver(post_save, sender=GuildMember)
def handle_guild_member_create(created, instance, *args, **kwargs):
    if not created:
        return

    # Create the aggregated stat row
    AggregatedGuildMemberWarStats.objects.get_or_create(guild=instance.guild, user_profile=instance.user)


@receiver(post_save, sender=Profile)
def handle_profile_created(created, instance, *args, **kwargs):
    if not created:
        return

    # Create the aggregated stat row
    AggregatedUserWarStats.objects.get_or_create(user_profile=instance)


@receiver(post_save, sender=WarStat)
def handle_war_stat_saved(created, instance, *args, **kwargs):
    # Re-calculate everything
    logger.info("Re-calculating stats for {0}".format(instance))

    AggregatedGuildWarStats.objects.get(guild=instance.attendance.war.guild).recalculate()
    AggregatedGuildMemberWarStats.objects.get(guild=instance.attendance.war.guild,
                                              user_profile=instance.attendance.user_profile).recalculate()
    AggregatedUserWarStats.objects.get(user_profile=instance.attendance.user_profile).recalculate()
