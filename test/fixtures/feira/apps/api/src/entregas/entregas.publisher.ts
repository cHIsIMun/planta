import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';

/** Leva cestas fechadas para a fila que o worker de entregas consome. */
@Injectable()
export class EntregasPublisher {
  private readonly fila = new Queue('entregas', { connection: { host: 'redis' } });

  @OnEvent('cesta.fechada')
  async enfileirar(evento: { cestaId: string }): Promise<void> {
    await this.fila.add('roteirizar', evento);
  }
}
