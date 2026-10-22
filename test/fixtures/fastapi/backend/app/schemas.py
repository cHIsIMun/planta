from datetime import datetime

from pydantic import BaseModel, EmailStr


class ClienteBase(BaseModel):
    email: EmailStr
    nome: str


class CriarCliente(ClienteBase):
    pass


class Cliente(ClienteBase):
    id: int
    criado_em: datetime
    apelido: str | None = None
