from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def userinfo_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "username": request.user.username,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
        })
    else:
        return JsonResponse({'detail': 'Unauthorized'}, status=401)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('interviews.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('api/userinfo/', userinfo_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
