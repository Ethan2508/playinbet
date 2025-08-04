from django.contrib import admin
from django.urls import path, include
from core.views import home

urlpatterns = [
    path('', home),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),
    path('api/', include('core.urls')),  # Ajout du préfixe api/
    path('admin/', admin.site.urls),
]