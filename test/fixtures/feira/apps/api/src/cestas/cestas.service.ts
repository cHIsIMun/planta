import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CestaRepository } from './cesta.repository';
import { Cesta } from './cesta.entity';
import { CriarCestaDto } from './dto/criar-cesta.dto';

@Injectable()
export class CestasService {
  constructor(
    private readonly repo: CestaRepository,
    private readonly eventos: EventEmitter2,
  ) {}

  async montar(dto: CriarCestaDto): Promise<Cesta> {
    const cesta = Object.assign(new Cesta(), dto);
    return this.repo.salvar(cesta);
  }

  async fechar(id: string): Promise<Cesta> {
    const cesta = await this.repo.buscar(id);
    cesta.status = 'fechada';
    const salva = await this.repo.salvar(cesta);
    this.eventos.emit('cesta.fechada', { cestaId: salva.id });
    return salva;
  }
}
