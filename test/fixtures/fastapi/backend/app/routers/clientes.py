from fastapi import APIRouter, Depends

from ..schemas import Cliente, CriarCliente
from ..servicos import ClienteService, servico_clientes

router = APIRouter(prefix="/clientes")


@router.post("", response_model=Cliente, status_code=201)
def criar(dados: CriarCliente, servico: ClienteService = Depends(servico_clientes)):
    return servico.criar(dados)


@router.get("/{cliente_id}", response_model=Cliente)
def buscar(cliente_id: int, servico: ClienteService = Depends(servico_clientes)):
    return servico.buscar(cliente_id)


@router.get("")
def listar(limite: int = 20):
    return []
