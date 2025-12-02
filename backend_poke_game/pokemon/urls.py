from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pokemon.api.reports_views import MyTopUsedView, MyTopWinsView
from pokemon.api.player_views import PlayerViewSet
from pokemon.api.pokemon_views import PokemonViewSet
from pokemon.api.reports_views import (
    ReportsView,
    GlobalReportsView,
    TopPokemonUsedView,
    TopPokemonWinsView,
    TopPlayersWinsView,
    TopPlayersUsedView,
)

router = DefaultRouter()
router.register(r'players', PlayerViewSet, basename='players')
router.register(r'pokemon', PokemonViewSet, basename='pokemon')

urlpatterns = [
    path('', include(router.urls)),

    # Reportes del jugador
    path('reports/player/', ReportsView.as_view()),

    # Reportes globales
    path('reports/global/', GlobalReportsView.as_view()),

    # Top 10
    path('reports/pokemon/top-used/', TopPokemonUsedView.as_view()),
    path('reports/pokemon/top-wins/', TopPokemonWinsView.as_view()),
    path('reports/players/top-used/', TopPlayersUsedView.as_view()),
    path('reports/players/top-wins/', TopPlayersWinsView.as_view()),
    path('reports/me/top-wins/', MyTopWinsView.as_view()),
    path('reports/me/top-used/', MyTopUsedView.as_view()),
]
