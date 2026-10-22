from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Cliente


@receiver(post_save, sender=Cliente)
def enviar_boas_vindas(sender, instance, created, **kwargs):
    if created:
        print(f"bem-vindo, {instance.nome}")
