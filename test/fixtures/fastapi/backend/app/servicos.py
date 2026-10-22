from .schemas import Cliente, CriarCliente


class ClienteService:
    def criar(self, dados: CriarCliente) -> Cliente:
        return Cliente(id=1, email=dados.email, nome=dados.nome, criado_em=None)

    def buscar(self, cliente_id: int) -> Cliente | None:
        return None


def servico_clientes() -> ClienteService:
    return ClienteService()
