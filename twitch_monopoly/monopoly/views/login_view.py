from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth import login, authenticate

class LoginView(View):
    initial = {'active_page': 'register'}
    template_name = 'signup_template.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {
            "active_page": "Вход",
            "error": None
        })

    def post(self, request, *args, **kwargs):
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_active:
                login(request, user)
                return redirect("/join")

            else:
                res = {'active_page': 'Вход',
                       "error": "Inactive user."}
                return render(request, self.template_name, res)
        else:
            res = {'active_page': 'Вход',
                   "error": "Invalid username or password."}
            return render(request, self.template_name, res)
