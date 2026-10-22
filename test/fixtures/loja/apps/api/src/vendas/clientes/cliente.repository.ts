import { Injectable } from '@nestjs/common';
import { Cliente } from './cliente.entity';

@Injectable()
export class ClienteRepository {
  async salvar(cliente: Cliente): Promise<Cliente> {
    return cliente;
  }
}
