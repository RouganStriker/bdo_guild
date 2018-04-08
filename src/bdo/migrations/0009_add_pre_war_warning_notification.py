# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2018-04-08 15:52
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations


def add_warning_option(apps, schema_editor):
    """Make the first character the main."""
    Guild = apps.get_model('bdo', 'Guild')

    for guild in Guild.objects.all():
        guild.discord_notifications['war_start_warning'] = True
        guild.save()


class Migration(migrations.Migration):

    dependencies = [
        ('bdo', '0008_make_first_charcter_main'),
    ]

    operations = [
        migrations.AlterField(
            model_name='guild',
            name='discord_notifications',
            field=django.contrib.postgres.fields.jsonb.JSONField(default={'war_cancel': True, 'war_create': True, 'war_end': True, 'war_start_warning': True}),
        ),
        migrations.RunPython(add_warning_option),
    ]
