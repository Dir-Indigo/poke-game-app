from rest_framework.routers import DefaultRouter
from pokemon.api import PlayerViewSet, PokemonViewSet

router = DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'pokemon', PokemonViewSet, basename='pokemon')

urlpatterns = router.urls