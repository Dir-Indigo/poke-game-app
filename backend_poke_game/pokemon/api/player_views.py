from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from pokemon.models import Player


class PlayerSeriaizer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True);
    
    class Meta:
        model = Player
        fields = ('id', 'username', 'heals', 'password')
    
    def create(self, validated_data):
        player = Player.objects.create_user(**validated_data)
        player.save()
        return player
    
class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSeriaizer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='use-heal')
    def use_heal(self, request):
        player = request.user
        if player.heals <= 0:
            return Response({"error": "No heals left!"}, status=status.HTTP_400_BAD_REQUEST)

        player.use_heal()
        return Response({"status": "heal used", "player": player.username, "heals_left": player.heals}, status=status.HTTP_200_OK)

    
    @action(detail=False, methods=['post'], url_path='reset-heals')
    def reset_heals(self, request):
        player = request.user
        player.reset_heals()
        return Response({'status': 'heals reset', 'player': player.username, 'heals': player.heals}, status=status.HTTP_200_OK)
    
    
    @action(detail=False, methods=['post'], url_path='register', permission_classes=[])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            password = serializer.validated_data.get('password')
            try:
                validate_password(password)
            except ValidationError as e:
                return Response({'password': e.messages}, status=status.HTTP_400_BAD_REQUEST)
            player = serializer.save()
            return Response(self.get_serializer(player).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)