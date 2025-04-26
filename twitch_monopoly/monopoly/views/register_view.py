from django.shortcuts import render
from django.views import View
from monopoly.models.session import Session

class RegisterView(View):
    initial = {'active_page': 'Регистрация'}
    template_name = 'signup_template.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, self.initial)

    def post(self, request, *args, **kwargs):
        conf = {
            "request": request,
            "username": request.POST.get("username", None),
            "firstname": request.POST.get("firstname", None),
            "lastname": request.POST.get("lastname", None),
            "password": request.POST.get("password", None),
            "email": request.POST.get("email", None)
        }
        successful, auth_or_error = Session().register(conf)

        if successful:
            res = {'active_page': 'Регистрация',
                   "error": "Confirmation sent to your email."}
            return render(request, self.template_name, res)
        else:
            res = {'active_page': 'Регистрация',
                   "error": auth_or_error}
            return render(request, self.template_name, res)
