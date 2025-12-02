from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models

from pokemon.models import Pokemon, Player
from pokemon.api.pokemon_views import PokemonSeriaizer

class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        my_pokemon = Pokemon.objects.filter(owner=user)

        total_pokemon = my_pokemon.count()
        total_uses = my_pokemon.aggregate(sum=models.Sum('uses'))['sum'] or 0
        total_wins = my_pokemon.aggregate(sum=models.Sum('wins'))['sum'] or 0

        top_used = my_pokemon.order_by('-uses').first()
        most_used = ({
            "name": top_used.name,
            "uses": top_used.uses
        } if top_used and top_used.uses > 0 else None)

        top_win = my_pokemon.order_by('-wins').first()
        most_wins = ({
            "name": top_win.name,
            "wins": top_win.wins
        } if top_win and top_win.wins > 0 else None)

        return Response({
            "total_pokemon": total_pokemon,
            "total_uses": total_uses,
            "total_wins": total_wins,
            "most_used": most_used,
            "most_wins": most_wins,
        })

class MyTopWinsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        pokemons = Pokemon.objects.filter(owner=user).order_by('-wins')

        return Response({
            "count": pokemons.count(),
            "results": [
                {
                    "id": p.id,
                    "name": p.name,
                    "nickname": p.nickname,
                    "wins": p.wins,
                    "uses": p.uses,
                }
                for p in pokemons
            ]
        })

class MyTopUsedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        pokemons = Pokemon.objects.filter(owner=user).order_by('-uses')

        return Response({
            "count": pokemons.count(),
            "results": [
                {
                    "id": p.id,
                    "name": p.name,
                    "nickname": p.nickname,
                    "uses": p.uses,
                    "wins": p.wins,
                }
                for p in pokemons
            ]
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
