from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pokemon.models import Pokemon
from pokemon.api.pokemon_views import PokemonSeriaizer

class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    # === Reporte del jugador actual ===
    def get(self, request):
        user = request.user

        my_pokemon = Pokemon.objects.filter(owner=user)

        top_win = my_pokemon.order_by('-wins').first()
        top_used = my_pokemon.order_by('-uses').first()

        return Response({
            "player": user.username,
            "top_winner": PokemonSeriaizer(top_win).data if top_win else None,
            "most_used": PokemonSeriaizer(top_used).data if top_used else None,
        })


class GlobalReportsView(APIView):
    permission_classes = [IsAuthenticated]

    # === Reporte global ===
    def get(self, request):
        top_win = Pokemon.objects.order_by('-wins').first()
        top_used = Pokemon.objects.order_by('-uses').first()

        return Response({
            "global_top_winner": PokemonSeriaizer(top_win).data if top_win else None,
            "global_most_used": PokemonSeriaizer(top_used).data if top_used else None,
        })
