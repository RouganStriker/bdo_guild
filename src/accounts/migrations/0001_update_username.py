from django.db import migrations


def update_username(apps, schema_editor):
    """Update existing usernames to use the Discord style username: user#1234"""
    User = apps.get_model('auth', 'User')

    # The discriminator is not a JSONB field so not bulk updating
    for user in User.objects.filter(socialaccount__isnull=False).prefetch_related('socialaccount_set'):
        user.username = '{0}#{1}'.format(user.username, user.socialaccount_set.all()[0].extra_data['discriminator'])
        user.save()


class Migration(migrations.Migration):

    dependencies = [
        ('socialaccount', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(update_username),
    ]
