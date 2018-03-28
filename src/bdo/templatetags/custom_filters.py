import json

from django import template
from django.contrib.messages.storage.session import SessionStorage
from django.core.serializers import serialize
from django.db.models.query import QuerySet
from django.utils.html import mark_safe

register = template.Library()


@register.filter
def jsonify(object):
    if isinstance(object, QuerySet):
        return mark_safe(serialize('json', object))
    if isinstance(object, SessionStorage):
        return str([message for message in object])

    try:
        return mark_safe(json.dumps(object))
    except TypeError:
        pass # try to_JSON() method

    return mark_safe(object.to_JSON())


@register.filter
def serialize_messages(messages):
    """Serialize the django.messages queue."""
    return mark_safe([[message.level_tag, str(message)] for message in messages])


register.filter('jsonify', jsonify)
register.filter('serialize_messages', serialize_messages)
