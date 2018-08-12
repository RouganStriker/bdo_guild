from django.db import migrations


def update_username(apps, schema_editor):
    """Update existing usernames to use Discord ID so it is unchangeable."""
    User = apps.get_model('auth', 'User')

    # The discriminator is not a JSONB field so not bulk updating
    for user in User.objects.filter(socialaccount__isnull=False).prefetch_related('socialaccount_set'):
        # Username can't contain hashes
        extra_data = user.socialaccount_set.all()[0].extra_data
        user.username = extra_data.get('id')
        user.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_update_username_again'),
    ]

    operations = [
        migrations.RunPython(update_username),
    ]