import { Body, Controller, Post } from '@nestjs/common';
import { Pedido } from './pedido.entity';

@Controller('pedidos')
export class PedidosController {
  @Post()
  finalizarCompra(@Body() dados: unknown): Promise<Pedido> {
    return Promise.resolve(dados as Pedido);
  }
}
