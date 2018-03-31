from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver

from bdo.context import UserContext
from bdo.models.activity import Activity
from bdo.models.guild import Guild
from bdo.models.war import War, WarAttendance, war_finish


# Guild Signals
@receiver(post_save, sender=Guild)
def handle_guild_save(created, instance, update_fields, *args, **kwargs):
    if not UserContext.has_current:
        return
    if created:
        type = Activity.TYPES.GUILD_CREATE.value
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

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.guild,
                            target=instance)


@receiver(post_save, sender=WarAttendance)
def handle_war_attendance_change(instance, update_fields, *args, **kwargs):
    if 'is_attending' not in update_fields or not UserContext.has_current:
        return

    # Track attendance changes
    type = Activity.TYPES.ATTENDANCE_UPDATE.value

    Activity.objects.create(type=type,
                            actor_profile=UserContext.current.user.profile,
                            guild=instance.war.guild,
                            extras={'is_attending': instance.is_attending},
                            target=instance)