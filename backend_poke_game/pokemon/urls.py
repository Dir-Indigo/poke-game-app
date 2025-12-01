from django.urls import path
from rest_framework.routers import DefaultRouter

# ViewSets
from pokemon.api import PlayerViewSet, PokemonViewSet

# Report Views
from pokemon.api.reports_views import (
    ReportsView,
    GlobalReportsView,
    TopPokemonUsedView,
    TopPokemonWinsView,
    TopPlayersWinsView,
    TopPlayersUsedView,
)

# ======================================================
#   ROUTER PRINCIPAL (ViewSets)
# ======================================================
router = DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'pokemon', PokemonViewSet, basename='pokemon')


# ======================================================
#   URLS ADICIONALES (Reportes)
# ======================================================
extra_urls = [
    # Reporte del jugador actual
    path("reports/me/", ReportsView.as_view(), name="reports_me"),

    # Reporte global
    path("reports/global/", GlobalReportsView.as_view(), name="reports_global"),

    # Top Pokémon
    path("reports/top-pokemon-used/", TopPokemonUsedView.as_view(), name="top_pokemon_used"),
    path("reports/top-pokemon-wins/", TopPokemonWinsView.as_view(), name="top_pokemon_wins"),

    # Top Jugadores
    path("reports/top-players-wins/", TopPlayersWinsView.as_view(), name="top_players_wins"),
    path("reports/top-players-used/", TopPlayersUsedView.as_view(), name="top_players_used"),
]


# ======================================================
#   URL FINAL DEL MÓDULO
# ======================================================
urlpatterns = router.urls + extra_urls
