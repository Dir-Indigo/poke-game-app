import random, requests
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pokemon.models import Pokemon
from rest_framework.exceptions import ValidationError

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

        # --- Límite de 10 pokemones ---
        if player.pokemon.count() >= 10:
            raise ValidationError({
                "detail": "Tu inventario está lleno. Solo puedes tener 10 Pokémon."
            })

        poke_id = request.data.get("poke_id")
        raw_nickname = request.data.get("nickname")
        nickname = raw_nickname.strip() if isinstance(raw_nickname, str) else None

        if not poke_id:
            raise ValidationError({"detail": "poke_id requerido"})

        poke_data = fetch_pokemon_data(poke_id)
        pokemon = Pokemon.objects.create(owner=player, nickname=nickname, **poke_data)

        return Response(PokemonSeriaizer(pokemon).data, status=201)

    @action(detail=False, methods=['get'], url_path='random')
    def get_random(self, request):
        return Response(fetch_pokemon_data(randomize=True))

    @action(detail=True, methods=['patch'], url_path='nickname')
    def update_nickname(self, request, pk=None):
        pokemon = self.get_object()
        new_nickname = request.data.get("nickname", "")

        if not isinstance(new_nickname, str):
            return Response({"error": "Nickname inválido"}, status=400)

        pokemon.nickname = new_nickname.strip() or None
        pokemon.save()

        return Response(PokemonSeriaizer(pokemon).data)

    @action(detail=False, methods=['get'], url_path='random-group')
    def get_random_group(self, request):
        size = random.randint(2, 4)
        group = [fetch_pokemon_data(randomize=True) for _ in range(size)]
        return Response({"count": size, "pokemons": group})

    @action(detail=True, methods=['post'], url_path='win')
    def win_battle(self, request, pk=None):
        pokemon = self.get_object()

        if pokemon.owner != request.user:
            return Response({"error": "No puedes editar pokémon ajenos"}, status=403)

        if pokemon.level < MAX_LEVEL:
            pokemon.hp += 3
            pokemon.attack += 5
            pokemon.defense += 5
            pokemon.level = min(MAX_LEVEL, (pokemon.hp + pokemon.attack + pokemon.defense) // 30)
            pokemon.save()

        return Response(PokemonSeriaizer(pokemon).data)

    @action(detail=True, methods=['post'], url_path='battle-result')
    def battle_result(self, request, pk=None):
        pokemon = self.get_object()
        player = pokemon.owner
        result = request.data.get("result")

        if result not in ["win", "lose"]:
            return Response({"error": "result = win/lose"}, status=400)

        # --- LOSE: Desactivar y sacar del team ---
        if result == "lose":
            pokemon.is_active = False
            player.team.remove(pokemon)

        # --- Siempre suma uso ---
        pokemon.add_use()
        player.add_use()

        # --- WIN ---
        if result == "win":
            pokemon.add_win()
            player.add_win()

            # Subida de stats
            if pokemon.level < MAX_LEVEL:
                pokemon.hp += 3
                pokemon.attack += 5
                pokemon.defense += 5
                pokemon.level = min(MAX_LEVEL, (pokemon.hp + pokemon.attack + pokemon.defense) // 30)

            # BONUS al líder
            leader = player.team.order_by('id').first()
            if leader and leader.id != pokemon.id:
                if leader.level < MAX_LEVEL:
                    leader.hp += 3
                    leader.attack += 5
                    leader.defense += 5
                    leader.level = min(MAX_LEVEL, (leader.hp + leader.attack + leader.defense) // 30)

                leader.uses += 1
                leader.save()

        pokemon.save()
        player.save()

        return Response({"status": f"battle {result} recorded"})

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

    level = min(MAX_LEVEL, max(1, (hp + attack + defense) // 30))

    abilities = data.get("abilities", [])

    special1_name = (
        abilities[0]["ability"]["name"].replace("-", " ").capitalize()
        if len(abilities) > 0 else "Special Move 1"
    )

    special2_name = (
        abilities[1]["ability"]["name"].replace("-", " ").capitalize()
        if len(abilities) > 1 else "Special Move 2"
    )

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
