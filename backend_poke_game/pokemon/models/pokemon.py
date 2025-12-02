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

    special1_name = models.CharField(max_length=100, blank=True, null=True)
    special1_power = models.IntegerField(default=0)

    special2_name = models.CharField(max_length=100, blank=True, null=True)
    special2_power = models.IntegerField(default=0)

    # CAMPOS DE REPORTES
    wins = models.IntegerField(default=0)
    uses = models.IntegerField(default=0)

    # PARA MULTIBATALLA
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-wins', '-uses', 'name']

    def add_use(self):
        self.uses += 1
        self.save()

    def add_win(self):
        self.wins += 1
        self.save()

    def __str__(self):
        if self.nickname:
            return f"{self.owner.username}'s {self.nickname} ({self.name})"
        return f"{self.owner.username}'s {self.name}"
