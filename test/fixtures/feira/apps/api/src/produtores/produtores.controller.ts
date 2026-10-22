import { Controller, Get, Query } from '@nestjs/common';
import { ProdutoresService } from './produtores.service';
import { Produtor } from './produtor.entity';
import { Produto } from './produto.entity';

@Controller('produtores')
export class ProdutoresController {
  constructor(private readonly service: ProdutoresService) {}

  @Get()
  listar(): Promise<Produtor[]> {
    return this.service.listar();
  }

  @Get('produtos')
  daEstacao(@Query('estacao') estacao: string): Promise<Produto[]> {
    return this.service.daEstacao(estacao);
  }
}
