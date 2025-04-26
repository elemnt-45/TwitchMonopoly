from django.urls import re_path
from django.contrib.auth.decorators import login_required

from monopoly.views.game_view import GameView
from monopoly.views.games_view import GamesView
from monopoly.views.login_view import LoginView
from monopoly.views.register_view import RegisterView
from monopoly.views.join_view import JoinView
from monopoly.views.profile_view import ProfileView

urlpatterns = [
    re_path(r'^$', GamesView.as_view(), name='games'),
    re_path(r'^login', LoginView.as_view(), name='login'),
    re_path(r'^signup', RegisterView.as_view(), name='signup'),
    re_path(r'^join/(?P<host_name>.*)', login_required(JoinView.as_view()), name='join'),
    re_path(r'^game/(?P<game_id>)', login_required(GameView.as_view()), name='game'),
    re_path(r'^profile/(?P<profile_user>.+)$', login_required(ProfileView.as_view()), name='profile'),
]
