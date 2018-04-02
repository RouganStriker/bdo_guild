from django.db import migrations


def update_username(apps, schema_editor):
    """Update existing usernames to use the Discord style username: user#1234"""
    User = apps.get_model('auth', 'User')

    # The discriminator is not a JSONB field so not bulk updating
    for user in User.objects.filter(socialaccount__isnull=False).prefetch_related('socialaccount_set'):
        # Username can't contain hashes
        extra_data = user.socialaccount_set.all()[0].extra_data
        user.username = '{0}{1}'.format(extra_data.get('username'), extra_data['discriminator'])
        user.first_name = '{0}#{1}'.format(extra_data.get('username'), extra_data['discriminator'])
        user.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_update_username'),
    ]

    operations = [
        migrations.RunPython(update_username),
    ]