# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2018-04-02 01:45
from __future__ import unicode_literals

from django.db import migrations
from django.db.models import Count


def set_main_character(apps, schema_editor):
    """Make the first character the main."""
    Profile = apps.get_model('bdo', 'Profile')
    profiles = (Profile.objects.annotate(char_count=Count('character__id'))
                               .filter(char_count__gte=1)
                               .exclude(character__is_main=True))

    for profile in profiles:
        character = profile.character_set.first()
        character.is_main = True
        character.save()


class Migration(migrations.Migration):

    dependencies = [
        ('bdo', '0007_update_fields'),
    ]

    operations = [
        migrations.RunPython(set_main_character),
    ]