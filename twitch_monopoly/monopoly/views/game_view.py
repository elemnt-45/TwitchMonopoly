from django.shortcuts import render
from django.http import JsonResponse
from django.views import View


def is_ajax(request):
    return request.headers.get('x-requested-with') == 'XMLHttpRequest'


class GameView(View):
    template_name = 'board_test.html'

    def get(self, request, *args, **kwargs):
        print(request.path)
        if is_ajax(request):
            print("AJAX");
            return JsonResponse({"data": "zhopa", "data2": "pizda"})
        else:
            user = request.user
            host_name = kwargs.get('host_name', user.username)
            return render(request, self.template_name)
