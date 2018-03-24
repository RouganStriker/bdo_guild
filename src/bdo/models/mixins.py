class UserPermissionMixin(object):
    """
    User permission checking mixin.
    """

    def user_can_edit(self, user):
        # Sub-classes will define their own cases
        return False
