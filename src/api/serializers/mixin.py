from django.core.exceptions import (NON_FIELD_ERRORS,
                                    ValidationError as DjangoValidationError)
from rest_framework import serializers
from rest_framework.settings import api_settings


def get_validation_error_detail(exc):
    assert isinstance(exc, (serializers.ValidationError, DjangoValidationError))

    NON_FIELD_ERRORS_KEY = api_settings.NON_FIELD_ERRORS_KEY
    DJANGO_NON_FIELD_ERRORS_KEY = NON_FIELD_ERRORS

    if isinstance(exc, DjangoValidationError):
        # DjangoValidationError with just a string or list of strings
        # passed. Return as a non field error.
        if not hasattr(exc, 'message_dict'):
            if hasattr(exc, 'messages'):
                messages = exc.messages
            else:
                messages = [exc.message]
            return {
                NON_FIELD_ERRORS_KEY: messages
            }

        errors = exc.message_dict

        # we convert django non field errors to DRF non field errors.
        if DJANGO_NON_FIELD_ERRORS_KEY in errors.keys():
            non_field_errors = []

            for error in errors.pop(DJANGO_NON_FIELD_ERRORS_KEY):
                # The error itself could be a DjangoValidationError instead
                # of a string. If so, we use its message attribute.
                if isinstance(error, DjangoValidationError):
                    error = error.message

                non_field_errors.append(error)

            errors[NON_FIELD_ERRORS_KEY] = non_field_errors

        return errors

    elif isinstance(exc.detail, dict):
        # If errors may be a dict we use the standard {key: list of values}.
        # Here we ensure that all the values are *lists* of errors.
        return dict([
            (key, value if isinstance(value, list) else [value])
            for key, value in exc.detail.items()
        ])

    elif isinstance(exc.detail, list):
        # Errors raised as a list are non-field errors.
        return {
            NON_FIELD_ERRORS_KEY: exc.detail
        }
    # Errors raised as a string are non-field errors.
    return {
        NON_FIELD_ERRORS_KEY: [exc.detail]
    }


class BaseSerializerMixin(object):
    """
    Mixin containing enhancements and modifications for the
    DRF serializer class.
    """

    def save(self, **kwargs):
        """
        Wraps the base save method to properly handle Django model validation.
        """
        try:
            return super(BaseSerializerMixin, self).save(**kwargs)
        except (serializers.ValidationError, DjangoValidationError) as exc:
            raise serializers.ValidationError(
                detail=get_validation_error_detail(exc)
            )
