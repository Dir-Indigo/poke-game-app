from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MaxValueValidator


class PlayerManager(BaseUserManager):
    def create_user(self, username, password=None):
        if not username:
            raise ValueError("Username is required")

        user = self.model(username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        user = self.create_user(username=username, password=password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class Player(AbstractBaseUser, PermissionsMixin):
    # =============================
    # DATOS BÁSICOS
    # =============================
    username = models.CharField(max_length=100, unique=True)

    # ===================================
    # SISTEMA DE CURACIÓN (HEALS)
    # ===================================
    heals = models.PositiveIntegerField(
        default=2,
        validators=[MaxValueValidator(2)]
    )

    # ===================================
    # ESTADÍSTICAS DE JUGADOR (GLOBAL)
    # ===================================
    wins = models.IntegerField(default=0)   # Total de batallas ganadas
    uses = models.IntegerField(default=0)   # Veces que participó en batallas

    # ===================================
    # CAMPOS DE DJANGO
    # ===================================
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []
    objects = PlayerManager()

    # =============================
    # MÉTODOS DEL SISTEMA
    # =============================
    def use_heal(self):
        """Consume 1 heal si queda disponible."""
        if self.heals > 0:
            self.heals -= 1
            self.save()

    def reset_heals(self):
        """Restablece las curaciones a 2."""
        self.heals = 2
        self.save()

    # =============================
    # MÉTODOS DE ESTADÍSTICAS
    # =============================
    def add_win(self):
        """Suma una victoria."""
        self.wins += 1
        self.uses += 1
        self.save()

    def add_use(self):
        """Suma una participación (uso)."""
        self.uses += 1
        self.save()

    # =============================
    # REPRESENTACIÓN
    # =============================
    def __str__(self):
        return self.username
