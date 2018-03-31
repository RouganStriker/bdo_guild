from django.db import models


class CharacterClass(models.Model):
    name = models.CharField(max_length=255)
    icon = models.ImageField()

    class Meta:
        ordering = ('name',)

    def __unicode__(self):
        return self.name

    def __repr__(self):
        return self.name

    def __str__(self):
        return self.name


class WarArea(models.Model):
    REGION_CHOICES = (
        (0, 'Balenos'),
        (1, 'Serendia'),
        (2, 'Calpheon'),
        (3, 'Mediah'),
        (4, 'Valencia'),
    )

    name = models.CharField(max_length=255, unique=True)
    region = models.IntegerField(choices=REGION_CHOICES)

    def __str__(self):
        return u"{0} - {1}".format(self.get_region_display(), self.name)


class WarNode(models.Model):
    TIER_CHOICES = (
        (1, 'Tier 1'),
        (2, 'Tier 2'),
        (3, 'Tier 3'),
        (4, 'Tier 4'),
    )
    # Aligns with date.weekday()
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    name = models.CharField(max_length=255, unique=True)
    war_day = models.IntegerField(choices=DAY_CHOICES)
    war_channel = models.IntegerField(default=1)
    area = models.ForeignKey(WarArea)
    tier = models.IntegerField(choices=TIER_CHOICES)

    class Meta:
        ordering = ('name',)
        unique_together = ('war_day', 'area')

    def __str__(self):
        return u"{0} - {1} ({2})".format(self.get_tier_display(), self.name, self.area)
