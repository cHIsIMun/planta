import { Injectable } from '@nestjs/common';
import { Produtor } from './produtor.entity';
import { Produto } from './produto.entity';

@Injectable()
export class ProdutoresService {
  async listar(): Promise<Produtor[]> {
    return [];
  }

  async daEstacao(estacao: string): Promise<Produto[]> {
    return [];
  }
}
