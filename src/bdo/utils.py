from enum import Enum


class ChoicesEnum(Enum):
    @classmethod
    def choices(cls):
        return ((field.value, field.name) for field in cls)
