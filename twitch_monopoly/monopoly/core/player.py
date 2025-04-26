INIT_PLAYER_MONEY = 1500


class Player(object):

    def __init__(self, id):
        self._id = id
        self.money = INIT_PLAYER_MONEY
        self._pos = 0
        self._lands = {}
