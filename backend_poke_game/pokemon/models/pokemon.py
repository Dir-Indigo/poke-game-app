from django.db import models
from django.conf import settings

class Pokemon(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pokemon')
    nickname = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=100)
    poke_id = models.IntegerField()
    level = models.IntegerField(default=1)
    hp = models.IntegerField()
    attack = models.IntegerField()
    defense = models.IntegerField()
    sprite_url = models.URLField(blank=True, null=True)
    back_sprite_url = models.URLField(blank=True, null=True)
    types = models.JSONField(default=list, blank=True)
    caught_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.nickname:
            return f"{self.owner.username}'s {self.nickname} ({self.name})"
        return f"{self.owner.username}'s {self.name}"
