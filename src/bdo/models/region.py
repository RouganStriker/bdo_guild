from django.db import models


class Region(models.Model):
    name = models.CharField(max_length=255, unique=True)
    node_war_start_time = models.TimeField()
    node_war_end_time = models.TimeField()
    conquest_war_start_time = models.TimeField()
    conquest_war_end_time = models.TimeField()

    def __str__(self):
        return self.name
