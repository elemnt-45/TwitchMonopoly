import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from monopoly.models.profile import Profile
from monopoly.core.game import Game

rooms = {}
games = {}


class ChatConsumer(WebsocketConsumer):
    def websocket_connect(self, message):
        self.accept()
        current_path = self.scope["path"]
        print("New websocket connect. User '", self.scope["user"], "' path '", current_path, "'")
        if "join" in current_path:
            self.connect_for_join(current_path)
        self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'You are now connected!'
        }))

    def receive(self, text_data=None, bytes_data=None):
        print("WEBSOCKET RECIEVE: ", text_data)
        msg = json.loads(text_data)
        action = msg["action"]
        if action == "start":
            self.start_game(self.scope["path"].split('/')[2])

    def connect_for_join(self, path):
        host = path.split('/')[2]
        print("Connecting for join. Username: '", self.scope["user"], "' host: '", host, "'")
        username = self.scope["user"].username
        print(username)
        if not self.add_to_room(host, username):
            self.send(text_data=json.dumps({
                "status": "failed to join"
            }))
        async_to_sync(self.channel_layer.group_add)(host, self.channel_name)

        data = []
        players = rooms[host]
        for player in players:
            profile_user = User.objects.get(username=player)
            profile_info = Profile.objects.get(user=profile_user)
            data.append({"username": player, "profile_pic": profile_info.profile_pic.url})

        async_to_sync(self.channel_layer.group_send)(
            host,
            {
                "type": "room.message",
                # "text": json.dumps({ "action" : "join", "data" : list(rooms[host])}),
                "text": json.dumps({"action": "join", "data": data}),
            },
        )
        print(rooms[host])

    def room_message(self, event):
        self.send(text_data=event["text"])

    def add_to_room(self, room_name, player_name):
        if room_name not in rooms:
            rooms[room_name] = set()
            rooms[room_name].add(room_name)
        if len(rooms[room_name]) >= 4:
            return False
        rooms[room_name].add(player_name)
        return True

    def start_game(self, host):
        if host not in games:
            players = rooms[host]
            game = Game(len(players))
            games[host] = game
        async_to_sync(self.channel_layer.group_send)(
            host,
            {
                "type": "room.message",
                "text": json.dumps({"action": "start"}),
            },
        )
