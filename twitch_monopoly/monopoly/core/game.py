from .player import Player
from .board import Board


class Game(object):
    def __init__(self, num_players):
        if num_players <= 0 or num_players > 4:
            self.notify_error("In correct player number, should be 1-4 "
                              "players.")
            return
        self.players = []
        for i in range(num_players):
            self.players.append(Player(i))
        self._board = Board()
        self._game_id = Game._game_id
        Game._game_id += 1
    _game_id = 0