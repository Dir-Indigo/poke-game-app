from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from pokemon.models import Player, Pokemon

class PlayerSeriaizer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Player
        fields = ('id', 'username', 'heals', 'password')

    def create(self, validated_data):
        return Player.objects.create_user(**validated_data)


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSeriaizer
    permission_classes = [IsAuthenticated]

    # Perfil
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(self.get_serializer(request.user).data)

    # Usar cura
    @action(detail=False, methods=['post'], url_path='use-heal')
    def use_heal(self, request):
        player = request.user
        if player.heals <= 0:
            return Response({"error": "No heals left!"}, status=400)

        player.use_heal()
        return Response({"status": "heal used", "heals_left": player.heals})

    # Reset curas
    @action(detail=False, methods=['post'], url_path='reset-heals')
    def reset_heals(self, request):
        player = request.user
        player.reset_heals()
        return Response({"status": "heals reset", "heals": player.heals})

    # Registro sin autenticación
    @action(detail=False, methods=['post'], url_path='register', permission_classes=[])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                validate_password(serializer.validated_data["password"])
            except ValidationError as e:
                return Response({"password": e.messages}, status=400)

            player = serializer.save()
            return Response(self.get_serializer(player).data, status=201)
        return Response(serializer.errors, status=400)

    # Obtener mi equipo
    @action(detail=False, methods=['get'], url_path='list-my-team')
    def get_team(self, request):
        from pokemon.api.pokemon_views import PokemonSeriaizer
        team = request.user.team.order_by('id')
        return Response(PokemonSeriaizer(team, many=True).data)

    # Guardar equipo
    @action(detail=False, methods=['post'], url_path='my-team')
    def set_team(self, request):
        player = request.user
        ids = request.data.get('pokemon_ids', [])

        if not isinstance(ids, list) or len(ids) > 4:
            return Response({"error": "El equipo debe tener hasta 4 pokémon"}, status=400)

        pokemons = Pokemon.objects.filter(id__in=ids, owner=player)

        if pokemons.count() != len(ids):
            return Response({"error": "Pokémon inválidos o no tuyos"}, status=400)

        if pokemons.filter(is_active=False).exists():
            return Response({"error": "No puedes usar pokémon inactivos"}, status=400)

        player.set_team(ids)
        return Response({"status": "Equipo actualizado"})
