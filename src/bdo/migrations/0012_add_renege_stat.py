# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2018-04-17 03:24
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bdo', '0011_populate_aggregated_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='aggregatedguildmemberwarstats',
            name='wars_reneged',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='aggregateduserwarstats',
            name='wars_reneged',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='warattendance',
            name='is_attending',
            field=models.IntegerField(choices=[(0, 'ATTENDING'), (1, 'NOT_ATTENDING'), (2, 'UNDECIDED'), (3, 'NO_SHOW'), (4, 'LATE'), (5, 'RENEGED')], default=2),
        ),
    ]