from django.contrib.auth import get_user_model
from rest_framework import serializers

from api.serializers.profile import SimpleProfileSerializer


class UserSerializer(serializers.ModelSerializer):
    profile = SimpleProfileSerializer()
    discord_id = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'groups', 'user_permissions', 'is_superuser', 'profile', 'discord_id')

    def get_discord_id(self, user):
        discord_account = user.socialaccount_set.filter(provider='discord_auth').first()

        if not discord_account:
            return None

        return u"{0}#{1}".format(discord_account.extra_data['username'],
                                 discord_account.extra_data['discriminator'])
