import { Controller, Get, Param } from '@nestjs/common';
import { Produto } from './produto.entity';

@Controller('produtos')
export class ProdutosController {
  @Get('destaques')
  destaques(): Promise<Produto[]> {
    return Promise.resolve([]);
  }

  @Get(':slug')
  buscarPorSlug(@Param('slug') slug: string): Promise<Produto | null> {
    return Promise.resolve(null);
  }
}
