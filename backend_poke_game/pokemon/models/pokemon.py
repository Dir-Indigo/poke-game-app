from django.db import models
from django.conf import settings


class Pokemon(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pokemon'
    )

    # Datos base
    nickname = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=100)
    poke_id = models.IntegerField()

    # Stats del Pokémon
    hp = models.IntegerField()
    attack = models.IntegerField()
    defense = models.IntegerField()

    sprite_url = models.URLField(blank=True, null=True)
    back_sprite_url = models.URLField(blank=True, null=True)
    types = models.JSONField(default=list, blank=True)

    caught_at = models.DateTimeField(auto_now_add=True)

    # ============================
    # CAMPOS NUEVOS PARA REPORTES
    # ============================
    wins = models.IntegerField(default=0)   # Cuántas batallas ganó
    uses = models.IntegerField(default=0)   # Cuántas veces fue usado
    
    class Meta:
        ordering = ['-wins', '-uses', 'name']

    def __str__(self):
        """Nombre visible del Pokémon"""
        if self.nickname:
            return f"{self.owner.username}'s {self.nickname} ({self.name})"
        return f"{self.owner.username}'s {self.name}"

    # ============================
    # MÉTODOS ÚTILES PARA REPORTES
    # ============================

    def add_use(self):
        """Suma 1 uso al Pokémon"""
        self.uses += 1
        self.save()

    def add_win(self):
        """Suma 1 victoria al Pokémon"""
        self.wins += 1
        self.save()
