import random, requests
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pokemon.models import Pokemon


class PokemonSeriaizer(serializers.ModelSerializer):
    class Meta:
        model = Pokemon
        fields = '__all__'
        read_only_fields = ['owner', 'caught_at', 'wins',
            'uses']


MAX_LEVEL = 100


class PokemonSeriaizer(serializers.ModelSerializer):
    class Meta:
        model = Pokemon
        fields = '__all__'
        read_only_fields = ['owner', 'caught_at', 'wins', 'uses']


class PokemonViewSet(viewsets.ModelViewSet):
    queryset = Pokemon.objects.all()
    serializer_class = PokemonSeriaizer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pokemon.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        player = request.user

        if player.pokemon.count() >= 10:
            return Response({"error": "You can only have 10 Pokémon in your team!"}, status=status.HTTP_400_BAD_REQUEST)

        poke_id = request.data.get("poke_id")
        nickname = request.data.get("nickname", "").strip() or None

        if not poke_id:
            return Response({"error": "Pokémon ID (poke_id) is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            poke_data = fetch_pokemon_data(poke_id)
        except (requests.RequestException, ValueError):
            return Response({"error": "Invalid Pokémon ID or PokeAPI unavailable."}, status=status.HTTP_400_BAD_REQUEST)

        pokemon = Pokemon.objects.create(
            owner=player,
            nickname=nickname,
            **poke_data
        )

        serializer = self.get_serializer(pokemon)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        pokemon = self.get_object()
        if pokemon.owner != request.user:
            return Response({"error": "You can only delete your own Pokémon."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], url_path='nickname')
    def update_nickname(self, request, pk=None):
        pokemon = self.get_object()
        if pokemon.owner != request.user:
            return Response({"error": "You can only edit your own Pokémon."}, status=status.HTTP_403_FORBIDDEN)

        nickname = request.data.get("nickname", "").strip() or None
        pokemon.nickname = nickname
        pokemon.save()
        serializer = self.get_serializer(pokemon)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='random')
    def get_random_pokemon(self, request):
        try:
            poke_data = fetch_pokemon_data(randomize=True)
        except requests.RequestException:
            return Response({"error": "Could not fetch Pokémon from PokeAPI."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(poke_data)

    @action(detail=False, methods=['get'], url_path='random-group')
    def get_random_group(self, request):
        try:
            size = random.randint(2, 4)
            group = [fetch_pokemon_data(randomize=True) for _ in range(size)]

            return Response({
                "count": size,
                "pokemons": group
            })
        except requests.RequestException:
            return Response(
                {"error": "Could not fetch Pokémon from PokeAPI."},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=True, methods=['post'], url_path='win')
    def win_battle(self, request, pk=None):
        pokemon = self.get_object()
        if pokemon.owner != request.user:
            return Response({"error": "You can only upgrade your own Pokémon."}, status=status.HTTP_403_FORBIDDEN)

        divisor = 30
        # Only increase stats if not at max level
        if pokemon.level < MAX_LEVEL:
            pokemon.hp += 3
            pokemon.attack += 5
            pokemon.defense += 5
            pokemon.level = min(MAX_LEVEL, max(1, (pokemon.hp + pokemon.attack + pokemon.defense) // divisor))
            pokemon.save()
            serializer = self.get_serializer(pokemon)
            return Response(serializer.data)
        else:
            return Response({"message": "Pokémon is already at max level."}, status=status.HTTP_200_OK)
 # ======================================================
    @action(detail=True, methods=['post'], url_path='battle-result')
    def battle_result(self, request, pk=None):
        """
        Registra si un Pokémon ganó o perdió una batalla.
        Aplica bonus al líder y desactiva al pokémon si pierde.
        """
        pokemon = self.get_object()
        player = pokemon.owner
        result = request.data.get("result")

        if result not in ["win", "lose"]:
            return Response(
                {"error": "result must be 'win' or 'lose'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # DERROTA → desactivar y sacar del team
        if result == "lose":
            pokemon.is_active = False
            player.team.remove(pokemon)

        # USO SIEMPRE
        pokemon.add_use()
        player.uses += 1

        # VICTORIA → sumar win y bonus
        if result == "win":
            pokemon.add_win()
            player.wins += 1

            divisor = 30
            MAX_LEVEL = 100

            if pokemon.level < MAX_LEVEL:
                pokemon.hp += 3
                pokemon.attack += 5
                pokemon.defense += 5
                new_level = (pokemon.hp + pokemon.attack + pokemon.defense) // divisor
                pokemon.level = min(MAX_LEVEL, max(1, new_level))

            # BONUS AL LÍDER DEL TEAM
            leader = player.team.order_by('id').first()
            if leader and leader.id != pokemon.id:
                if leader.level < MAX_LEVEL:
                    leader.hp += 3
                    leader.attack += 5
                    leader.defense += 5
                    lvl = (leader.hp + leader.attack + leader.defense) // divisor
                    leader.level = min(MAX_LEVEL, max(1, lvl))

                leader.uses += 1
                leader.save()

        # GUARDAR
        pokemon.save()
        player.save()

        return Response({"status": f"battle '{result}' recorded"})

@action(detail=False, methods=['get'], url_path='stats/me/most-wins')
def stats_my_most_wins(self, request):
        player = request.user
        pokemons = Pokemon.objects.filter(owner=player).order_by('-wins')

        return Response({
            "count": pokemons.count(),
            "results": [{
                "poke_id": p.poke_id,
                "name": p.name,
                "nickname": p.nickname,
                "wins": p.wins,
                "uses": p.uses,
                "sprite_url": p.sprite_url
            } for p in pokemons]
        })
@action(detail=False, methods=['get'], url_path='stats/me/most-used')
def stats_my_most_used(self, request):
        player = request.user
        pokemons = Pokemon.objects.filter(owner=player).order_by('-uses')

        return Response({
            "count": pokemons.count(),
            "results": [{
                "poke_id": p.poke_id,
                "name": p.name,
                "nickname": p.nickname,
                "wins": p.wins,
                "uses": p.uses,
                "sprite_url": p.sprite_url
            } for p in pokemons]
        })


@action(detail=False, methods=['get'], url_path='stats/me/summary')
def stats_my_summary(self, request):
        player = request.user
        pokemons = Pokemon.objects.filter(owner=player)

        most_used = pokemons.order_by('-uses').first()
        most_wins = pokemons.order_by('-wins').first()

        return Response({
            "total_pokemon": pokemons.count(),
            "total_uses": sum(p.uses for p in pokemons),
            "total_wins": sum(p.wins for p in pokemons),

            "most_used": {
                "name": most_used.name if most_used else None,
                "uses": most_used.uses if most_used else None
            },

            "most_wins": {
                "name": most_wins.name if most_wins else None,
                "wins": most_wins.wins if most_wins else None
            }
        })
@action(detail=False, methods=['get'], url_path='stats/global/most-wins')
def stats_global_most_wins(self, request):
        pokemons = Pokemon.objects.all().order_by('-wins')

        return Response({
            "count": pokemons.count(),
            "results": [{
                "player": p.owner.username,
                "poke_id": p.poke_id,
                "name": p.name,
                "nickname": p.nickname,
                "wins": p.wins,
                "uses": p.uses,
                "sprite_url": p.sprite_url
            } for p in pokemons]
        })

@action(detail=False, methods=['get'], url_path='stats/global/most-used')
def stats_global_most_used(self, request):
        pokemons = Pokemon.objects.all().order_by('-uses')

        return Response({
            "count": pokemons.count(),
            "results": [{
                "player": p.owner.username,
                "poke_id": p.poke_id,
                "name": p.name,
                "nickname": p.nickname,
                "uses": p.uses,
                "wins": p.wins,
                "sprite_url": p.sprite_url
            } for p in pokemons]
        })
@action(detail=False, methods=['get'], url_path='stats/global/summary')
def stats_global_summary(self, request):
        pokemons = Pokemon.objects.all()

        most_used = pokemons.order_by('-uses').first()
        most_wins = pokemons.order_by('-wins').first()

        return Response({
            "total_pokemon": pokemons.count(),
            "total_uses": sum(p.uses for p in pokemons),
            "total_wins": sum(p.wins for p in pokemons),

            "most_used": {
                "player": most_used.owner.username if most_used else None,
                "name": most_used.name if most_used else None,
                "uses": most_used.uses if most_used else None
            },

            "most_wins": {
                "player": most_wins.owner.username if most_wins else None,
                "name": most_wins.name if most_wins else None,
                "wins": most_wins.wins if most_wins else None
            }
        })
def fetch_pokemon_data(poke_id=None, randomize=False):
    if randomize:
        poke_id = random.randint(1, 1025)
    if not poke_id:
        raise ValueError("poke_id is required unless randomize=True")

    res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{poke_id}")
    res.raise_for_status()
    data = res.json()

    stats = {s["stat"]["name"]: s["base_stat"] for s in data["stats"]}
    types = [t["type"]["name"].capitalize() for t in data["types"]]

    hp = stats.get("hp", 50) * 5
    attack = stats.get("attack", 50)
    defense = stats.get("defense", 50)

    # Nivel
    divisor = 30
    level = min(MAX_LEVEL, max(1, (hp + attack + defense) // divisor))

    abilities = data.get("abilities", [])

    # Obtener nombres
    special1_name = (
        abilities[0]["ability"]["name"].replace("-", " ").capitalize()
        if len(abilities) > 0 else "Special Move 1"
    )

    special2_name = (
        abilities[1]["ability"]["name"].replace("-", " ").capitalize()
        if len(abilities) > 1 else "Special Move 2"
    )

    # Poder del ataque especial (2x y 1.6x por ejemplo)
    special1_power = int(attack * 2)
    special2_power = int(attack * 1.6)

    return {
        "poke_id": data["id"],
        "name": data["name"].capitalize(),
        "hp": hp,
        "attack": attack,
        "defense": defense,
        "sprite_url": data["sprites"]["front_default"],
        "back_sprite_url": data["sprites"]["back_default"],
        "types": types,
        "level": level,

        "special1_name": special1_name,
        "special1_power": special1_power,
        "special2_name": special2_name,
        "special2_power": special2_power,
    }

    @action(detail=False, methods=['get'], url_path='random-group')
    def get_random_group(self, request):
        try:
            size = random.randint(2, 4)
            group = [fetch_pokemon_data(randomize=True) for _ in range(size)]

            return Response({
                "count": size,
                "pokemons": group
            })
        except requests.RequestException:
            return Response(
                {"error": "Could not fetch Pokémon from PokeAPI."},
                status=status.HTTP_400_BAD_REQUEST
            )

