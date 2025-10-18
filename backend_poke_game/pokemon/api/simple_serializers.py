from rest_framework import serializers
from pokemon.models import Player

class PlayerSimpleSerializer(serializers.ModelSerializer):
  class Meta:
    model = Player
    fields = ('id', 'username', 'heals')