import { Module } from '@nestjs/common';
import { CestasController } from './cestas/cestas.controller';
import { CestasService } from './cestas/cestas.service';
import { CestaRepository } from './cestas/cesta.repository';
import { ProdutoresController } from './produtores/produtores.controller';
import { ProdutoresService } from './produtores/produtores.service';
import { EntregasPublisher } from './entregas/entregas.publisher';

@Module({
  controllers: [CestasController, ProdutoresController],
  providers: [CestasService, CestaRepository, ProdutoresService, EntregasPublisher],
})
export class AppModule {}
