from depocs import Scoped


class UserContext(Scoped):
    def __init__(self, user):
        self.user = user
