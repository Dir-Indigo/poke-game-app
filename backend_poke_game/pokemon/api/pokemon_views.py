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
        read_only_fields = ['owner', 'caught_at']


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

    return {
        "poke_id": data["id"],
        "name": data["name"].capitalize(),
        "hp": stats.get("hp", 50) * 5,
        "attack": stats.get("attack", 50),
        "defense": stats.get("defense", 50),
        "sprite_url": data["sprites"]["front_default"],
        "types": types,
    }
