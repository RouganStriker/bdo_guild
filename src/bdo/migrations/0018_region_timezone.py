# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2018-07-01 21:14
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bdo', '0017_add_region_to_guild_and_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='region',
            name='timezone',
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
