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
        player = Player.objects.create_user(**validated_data)
        return player


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSeriaizer
    permission_classes = [IsAuthenticated]

    # ===========================
    #  MI PERFIL
    # ===========================
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    # ===========================
    #  USAR CURA
    # ===========================
    @action(detail=False, methods=['post'], url_path='use-heal')
    def use_heal(self, request):
        player = request.user

        if player.heals <= 0:
            return Response({"error": "No heals left!"}, status=status.HTTP_400_BAD_REQUEST)

        player.use_heal()
        return Response({
            "status": "heal used",
            "player": player.username,
            "heals_left": player.heals
        })

    # ===========================
    #  RESETEAR CURAS
    # ===========================
    @action(detail=False, methods=['post'], url_path='reset-heals')
    def reset_heals(self, request):
        player = request.user
        player.reset_heals()
        return Response({
            'status': 'heals reset',
            'player': player.username,
            'heals': player.heals
        })

    # ===========================
    #  REGISTRO DE USUARIOS (SIN JWT)
    # ===========================
    @action(detail=False, methods=['post'], url_path='register', permission_classes=[])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():

            # Validar contraseña
            password = serializer.validated_data.get('password')
            try:
                validate_password(password)
            except ValidationError as e:
                return Response({'password': e.messages}, status=status.HTTP_400_BAD_REQUEST)

            # Crear usuario
            player = serializer.save()

            return Response(
                self.get_serializer(player).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ===========================
    #  LISTAR MI TEAM
    # ===========================
    @action(detail=False, methods=['get'], url_path='list-my-team')
    def get_team(self, request):
        from pokemon.api.pokemon_views import PokemonSeriaizer
        player = request.user
        team = player.team.order_by('id')
        serializer = PokemonSeriaizer(team, many=True)
        return Response(serializer.data)

    # ===========================
    #  DEFINIR MI TEAM
    # ===========================
    @action(detail=False, methods=['post'], url_path='my-team')
    def set_team(self, request):
        player = request.user
        pokemon_ids = request.data.get('pokemon_ids', [])

        # Validar formato
        if not isinstance(pokemon_ids, list) or len(pokemon_ids) > 4:
            return Response(
                {"error": "Debes enviar una lista de hasta 4 IDs de Pokémon."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar pokémones
        pokemons = Pokemon.objects.filter(id__in=pokemon_ids, owner=player)

        if pokemons.count() != len(pokemon_ids):
            return Response(
                {"error": "Algunos Pokémon no existen o no te pertenecen."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ❌ Validar inactivos ANTES de guardar
        if pokemons.filter(is_active=False).exists():
            return Response(
                {"error": "No puedes añadir Pokémon inactivos al equipo."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Guardar equipo
        player.set_team(pokemon_ids)

        return Response({"status": "Equipo actualizado correctamente."})
