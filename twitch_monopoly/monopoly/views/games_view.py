from django.shortcuts import render
from django.views import View


class GamesView(View):
    template_name = 'games_template.html'

    def get(self, request, *args, **kwargs):
        print(request.path)
        user = request.user
        host_name = kwargs.get('host_name', user.username)

        return render(request, self.template_name)
