from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.serializers.guild_content import GuildMembershipSerializer
from api.serializers.mixin import BaseSerializerMixin
from bdo.models.character import Character, Profile
from bdo.models.content import CharacterClass


class ProfileDefault(object):
    def set_context(self, serializer_field):
        self.profile = serializer_field.context['request'].user.profile

    def __call__(self):
        return self.profile


class CharacterSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    character_class = serializers.PrimaryKeyRelatedField(queryset=CharacterClass.objects.all())
    profile = serializers.PrimaryKeyRelatedField(read_only=True, default=ProfileDefault())

    class Meta:
        model = Character
        fields = '__all__'
        read_only_fields = ('profile',)

    def toggle_off_other_main(self, current_character):
        (Character.objects.filter(profile=current_character.profile)
                          .exclude(id=current_character.id)
                          .update(is_main=False))

    def create(self, validated_data):
        character = super(CharacterSerializer, self).create(validated_data)

        if character.is_main:
            self.toggle_off_other_main(character)

        return character

    def update(self, instance, validated_data):
        is_main = validated_data.get('is_main', None)
        character = super(CharacterSerializer, self).update(instance, validated_data)

        if is_main:
            self.toggle_off_other_main(character)

        return character


class NestedCharacterSerializer(CharacterSerializer):
    character_class = serializers.StringRelatedField()

    class Meta(CharacterSerializer.Meta):
        fields = ('id', 'name', 'character_class', 'level', 'ap', 'aap', 'dp', 'is_main')


class ProfileSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    character_set = NestedCharacterSerializer(many=True, read_only=True)
    stats = serializers.DictField(read_only=True)
    family_name = serializers.CharField(max_length=255)
    membership = GuildMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = ('id', 'availability', 'auto_sign_up', 'discord_id', 'family_name', 'character_set', 'preferred_roles', 'stats', 'membership')
        read_only_fields = ('id', 'character_set', 'stats', 'membership')

    def __init__(self, *args, **kwargs):
        super(ProfileSerializer, self).__init__(*args, **kwargs)

        if not self.query_include_stats():
            self.fields.pop('stats')
        if self.instance is not None:
            # Allow setting family name and discord id in creation
            self.fields['family_name'].read_only = True
            self.fields['discord_id'].read_only = True

    def query_include_stats(self):
        query = self.context['request'].query_params

        return 'include' in query and 'stats' in query['include'].split(',')

    def create(self, validated_data):
        user = self.context['request'].user
        discord_account = user.socialaccount_set.filter(provider='discord_auth')
        validated_data['user'] = user
        family_name = validated_data.get('family_name')

        if discord_account:
            validated_data['discord_id'] = discord_account[0].extra_data['id']

        # Create new profile or update family name casing of existing
        profile, _ = Profile.objects.update_or_create(family_name__iexact=family_name,
                                                      user__isnull=True,
                                                      defaults=validated_data)
        profile.refresh_guilds()

        return profile

    def update(self, instance, validated_data):
        auto_sign_up = validated_data.get('auto_sign_up', None)
        if auto_sign_up and not instance.character_set.filter(is_main=True).exists():
            raise ValidationError("Cannot enable auto sign up without specifying a main character.")

        return super(ProfileSerializer, self).update(instance, validated_data)
