import { Injectable } from '@nestjs/common';
import { Cesta } from './cesta.entity';

@Injectable()
export class CestaRepository {
  async salvar(cesta: Cesta): Promise<Cesta> {
    return cesta;
  }

  async buscar(id: string): Promise<Cesta | null> {
    return null;
  }
}
