from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('interviews.urls')),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_URL)



#from django.urls import re_path
#from django.views.generic import TemplateView
#from django.conf import settings
#from django.conf.urls.static import static
#
#urlpatterns = [
#    # ... 其他路径
#    re_path(r'^$', TemplateView.as_view(template_name='index.html'), name='home'),
#    re_path(r'^(?:(?!api|admin|api-auth|media).)*/$', TemplateView.as_view(template_name='index.html')),
#]
#
#if settings.DEBUG:
#    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
#    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
