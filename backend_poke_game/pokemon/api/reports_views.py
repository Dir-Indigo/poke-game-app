from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pokemon.models import Pokemon, Player
from pokemon.api.pokemon_views import PokemonSeriaizer

class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        my_pokemon = Pokemon.objects.filter(owner=user)

        top_win = my_pokemon.order_by('-wins').first()
        top_used = my_pokemon.order_by('-uses').first()

        return Response({
            "player": user.username,

            "player_stats": {
                "wins": user.wins,
                "uses": user.uses,
                "total_pokemon": my_pokemon.count(),
            },

            "top_pokemon_winner": PokemonSeriaizer(top_win).data if top_win else None,
            "top_pokemon_used": PokemonSeriaizer(top_used).data if top_used else None,

            "pokemon_list": PokemonSeriaizer(my_pokemon, many=True).data
        })

class GlobalReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pokemons = Pokemon.objects.all()

        top_win = pokemons.order_by('-wins').first()
        top_used = pokemons.order_by('-uses').first()

        return Response({
            "global_total_pokemon": pokemons.count(),
            "global_total_uses": sum(p.uses for p in pokemons),
            "global_total_wins": sum(p.wins for p in pokemons),

            "global_top_winner": PokemonSeriaizer(top_win).data if top_win else None,
            "global_most_used": PokemonSeriaizer(top_used).data if top_used else None,
        })


class TopPokemonUsedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pokemons = Pokemon.objects.order_by('-uses')[:10]

        return Response({
            "count": len(pokemons),
            "results": [
                {
                    "player": p.owner.username,
                    "poke_id": p.poke_id,
                    "name": p.name,
                    "nickname": p.nickname,
                    "uses": p.uses,
                    "wins": p.wins,
                    "sprite_url": p.sprite_url,
                }
                for p in pokemons
            ]
        })

class TopPokemonWinsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pokemons = Pokemon.objects.order_by('-wins')[:10]

        return Response({
            "count": len(pokemons),
            "results": [
                {
                    "player": p.owner.username,
                    "poke_id": p.poke_id,
                    "name": p.name,
                    "nickname": p.nickname,
                    "wins": p.wins,
                    "uses": p.uses,
                    "sprite_url": p.sprite_url,
                }
                for p in pokemons
            ]
        })

class TopPlayersWinsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        players = Player.objects.order_by('-wins')[:10]

        return Response({
            "count": len(players),
            "results": [
                {
                    "username": p.username,
                    "wins": p.wins,
                    "uses": p.uses,
                }
                for p in players
            ]
        })

class TopPlayersUsedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        players = Player.objects.order_by('-uses')[:10]

        return Response({
            "count": len(players),
            "results": [
                {
                    "username": p.username,
                    "uses": p.uses,
                    "wins": p.wins,
                }
                for p in players
            ]
        })
