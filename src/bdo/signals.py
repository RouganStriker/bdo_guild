from logging import getLogger

from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import pre_delete, post_save, post_delete
from django.dispatch import receiver

from bdo.context import UserContext
from bdo.models.activity import Activity
from bdo.models.character import Profile
from bdo.models.guild import Guild, GuildMember, WarRole
from bdo.models.stats import (AggregatedGuildMemberWarStats,
                              AggregatedGuildWarStats,
                              AggregatedUserWarStats)
from bdo.models.war import War, WarAttendance, WarStat, war_finish

logger = getLogger('bdo')


# Guild Signals
@receiver(post_save, sender=Guild)
def handle_guild_save(created, instance, update_fields, *args, **kwargs):
    if created:
        type = Activity.TYPES.GUILD_CREATE.value
        AggregatedGuildWarStats.objects.create(guild=instance)
    else:
        type = Activity.TYPES.GUILD_UPDATE.value
    if not UserContext.has_current:
        return

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance,
                            target_description=str(instance))

    if not created and set(update_fields) & {'discord_id', 'discord_roles'}:
        # Track integration updates
        Activity.objects.create(type=Activity.TYPES.GUILD_UPDATE_INTEGRATION.value,
                                actor_profile=UserContext.current.user.profile,
                                guild=instance,
                                target_description=str(instance))


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
                            target=instance,
                            target_description=str(instance))


@receiver(pre_delete, sender=War)
def handle_war_delete(instance, *args, **kwargs):
    instance.notify_war_cancelled()

    if not UserContext.has_current:
        return

    type = Activity.TYPES.WAR_DELETE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.guild,
                            target_description=str(instance))


@receiver(war_finish)
def handle_war_finish(instance, *args, **kwargs):
    instance.notify_war_finished()

    if not UserContext.has_current:
        return
    type = Activity.TYPES.WAR_END.value
    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.guild,
                            target=instance,
                            target_description=str(instance))


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
                            target=instance,
                            target_description=str(instance))

    # Update aggregates
    stat, created = AggregatedGuildMemberWarStats.objects.get_or_create(guild=instance.war.guild,
                                                                        user_profile=instance.user_profile)
    stat.recalculate()
    AggregatedUserWarStats.objects.get(user_profile=instance.user_profile).recalculate()


@receiver(post_save, sender=GuildMember)
def handle_guild_member_create(created, instance, *args, **kwargs):
    if not created:
        return

    # Create the aggregated stat row
    AggregatedGuildMemberWarStats.objects.get_or_create(guild_id=instance.guild_id, user_profile_id=instance.user_id)


@receiver(post_save, sender=Profile)
def handle_profile_created(created, instance, *args, **kwargs):
    if not created:
        return

    # Create the aggregated stat row
    AggregatedUserWarStats.objects.get_or_create(user_profile=instance)

    # By default select all war roles as preferred roles
    instance.preferred_roles = WarRole.objects.filter(custom_for__isnull=True)


@receiver(post_save, sender=WarStat)
def handle_war_stat_saved(created, instance, *args, **kwargs):
    # Re-calculate everything
    logger.debug("Re-calculating stats for {0}".format(instance))

    AggregatedGuildWarStats.objects.get(guild=instance.attendance.war.guild).recalculate()
    AggregatedGuildMemberWarStats.objects.get(guild=instance.attendance.war.guild,
                                              user_profile=instance.attendance.user_profile).recalculate()
    AggregatedUserWarStats.objects.get(user_profile=instance.attendance.user_profile).recalculate()

    if not UserContext.has_current:
        return

    if created:
        type = Activity.TYPES.WAR_STAT_CREATE.value
    else:
        type = Activity.TYPES.WAR_STAT_UPDATE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.attendance.war.guild,
                            target=instance,
                            target_description = str(instance))


@receiver(post_delete, sender=WarStat)
def handle_war_stat_deleted(instance, *args, **kwargs):
    # Re-calculate everything
    logger.debug("Re-calculating stats for {0}".format(instance))

    AggregatedGuildWarStats.objects.get(guild=instance.attendance.war.guild).recalculate()
    AggregatedGuildMemberWarStats.objects.get(guild=instance.attendance.war.guild,
                                              user_profile=instance.attendance.user_profile).recalculate()
    AggregatedUserWarStats.objects.get(user_profile=instance.attendance.user_profile).recalculate()

    if not UserContext.has_current:
        return

    Activity.objects.create(type=Activity.TYPES.WAR_STAT_DELETE.value,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.attendance.war.guild,
                            target_description=str(instance))


@receiver(pre_delete)
def update_activities_pre_delete(instance, *args, **kwargs):
    # Update existing activity references.
    # Newer activities should populate target_description by default
    if instance.__class__ not in [Guild, War, WarStat]:
        return

    content_type = ContentType.objects.get_for_model(instance)
    Activity.objects.filter(content_type=content_type, object_id=instance.id).update(target_description=str(instance))
