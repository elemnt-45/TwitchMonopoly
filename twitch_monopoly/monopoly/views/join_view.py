from django.shortcuts import render, redirect
from django.views import View
from django.http import JsonResponse
from monopoly.models.profile import Profile

class JoinView(View):
    template_name = 'join_template.html'

    def get(self, request, *args, **kwargs):
            print(request.path)
            user = request.user
            host_name = kwargs.get('host_name')
            if not host_name:
                return redirect("./" + user.username)
            try:
                profile_user = Profile.objects.get(user=user)
            except Exception:
                profile_user = None

            print(profile_user.profile_pic.url)
            return render(request, self.template_name, {
                "user":  user.username,
                "profile_pic" : profile_user.profile_pic.url if profile_user.profile_pic else "static 'monopoly/assets/default_avatar.png'",
                "host_name": host_name if len(host_name) else user.username
            })
