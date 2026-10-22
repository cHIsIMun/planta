from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from .models import Cliente, Pedido


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()

    @action(detail=True, methods=["post"])
    def desativar(self, request, pk=None):
        cliente = self.get_object()
        cliente.ativo = False
        cliente.save()
        return Response(status=204)


@api_view(["GET"])
def resumo(request):
    return Response({"pedidos": Pedido.objects.count()})
