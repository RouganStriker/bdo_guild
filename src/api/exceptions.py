from logging import getLogger

from rest_framework.views import exception_handler

logger = getLogger('bdo')


def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    logger.exception(exc)

    return response