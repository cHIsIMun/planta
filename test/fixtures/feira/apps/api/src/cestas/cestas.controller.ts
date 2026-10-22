import { Body, Controller, Param, Post } from '@nestjs/common';
import { CestasService } from './cestas.service';
import { Cesta } from './cesta.entity';
import { CriarCestaDto } from './dto/criar-cesta.dto';

@Controller('cestas')
export class CestasController {
  constructor(private readonly service: CestasService) {}

  @Post()
  montar(@Body() dto: CriarCestaDto): Promise<Cesta> {
    return this.service.montar(dto);
  }

  @Post(':id/fechar')
  fechar(@Param('id') id: string): Promise<Cesta> {
    return this.service.fechar(id);
  }
}
