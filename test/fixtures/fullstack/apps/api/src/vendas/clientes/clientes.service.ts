import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClienteRepository } from './cliente.repository';
import { Cliente } from './cliente.entity';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly repo: ClienteRepository,
    private readonly eventos: EventEmitter2,
  ) {}

  async criar(dto: CriarClienteDto): Promise<Cliente> {
    const cliente = Object.assign(new Cliente(), dto);
    const salvo = await this.repo.salvar(cliente);
    this.eventos.emit('cliente.cadastrado', { clienteId: salvo.id });
    return salvo;
  }

  async buscar(id: string): Promise<Cliente | null> {
    return null;
  }
}
