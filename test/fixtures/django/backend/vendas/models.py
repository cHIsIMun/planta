from django.db import models


class StatusPedido(models.TextChoices):
    ABERTO = "aberto"
    PAGO = "pago"
    CANCELADO = "cancelado"


class Registro(models.Model):
    """Campos comuns a todos os models."""

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class Cliente(Registro):
    email = models.EmailField(unique=True, max_length=255)
    nome = models.CharField(max_length=120)

    def __str__(self):
        return self.nome


class Pedido(Registro):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="pedidos")
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=StatusPedido.choices, default=StatusPedido.ABERTO)
    observacao = models.TextField(null=True)
