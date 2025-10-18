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
    username = models.CharField(max_length=100, unique=True)
    heals = models.PositiveIntegerField(default=2, validators=[MaxValueValidator(2)])
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)


    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    objects = PlayerManager()
    
    def use_heal(self):
        if self.heals > 0:
            self.heals -= 1;
            self.save()
    
    def reset_heals(self):
        self.heals = 2
        self.save()

    def __str__(self):
        return self.username
	