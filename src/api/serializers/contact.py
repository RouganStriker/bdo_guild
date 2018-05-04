from logging import getLogger

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import serializers

from api.serializers.mixin import BaseSerializerMixin

logger = getLogger('bdo')


class ContactSerializer(BaseSerializerMixin, serializers.Serializer):
    email = serializers.EmailField()
    summary = serializers.CharField(max_length=255)
    category = serializers.ChoiceField(choices=(
        ('account', 'Account Changes'),
        ('bug', 'Bug'),
        ('feedback', 'Feedback'),
        ('other', 'Other'),
    ))
    description = serializers.CharField(max_length=1024)

    def update(self, instance, validated_data):
        raise Exception('Method is not supported')

    def create(self, validated_data):
        recipient = getattr(settings, 'SUPPORT_EMAIL')
        subject = '[{0}] {1}'.format(validated_data.get('category'), validated_data.get('summary'))

        logger.info("{0} sent support request".format(self.context['request'].user))

        send_mail(
            subject,
            validated_data.get('description'),
            from_email=validated_data.get('email'),
            recipient_list=[recipient]
        )
