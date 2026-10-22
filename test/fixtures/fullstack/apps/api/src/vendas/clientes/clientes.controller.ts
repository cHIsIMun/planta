import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Cliente } from './cliente.entity';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  criar(@Body() dto: CriarClienteDto): Promise<Cliente> {
    return this.service.criar(dto);
  }

  @Get(':id')
  buscar(@Param('id') id: string): Promise<Cliente | null> {
    return this.service.buscar(id);
  }
}
