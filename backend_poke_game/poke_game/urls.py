"""
URL configuration for poke_game project.

Aquí se configuran todas las rutas principales del proyecto.
Incluye:
- Admin de Django
- Endpoints del módulo Pokémon
- Autenticación con SimpleJWT
"""

from django.contrib import admin
from django.urls import path, include

# JWT personalizado
from pokemon.api import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    # =============================
    #   ADMINISTRADOR DE DJANGO
    # =============================
    path('admin/', admin.site.urls),

    # =============================
    #        API PRINCIPAL
    # =============================
    path('api/', include('pokemon.urls')),   # Todas las rutas del módulo Pokémon

    # =============================
    #        AUTENTICACIÓN JWT
    # =============================
    path('api/token/', MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name="token_refresh"),
]
