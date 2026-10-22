import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class EmailListener {
  @OnEvent('cliente.cadastrado')
  enviarBoasVindas(evento: { clienteId: string }): void {}

  @Cron('0 3 * * *')
  reenviarPendentes(): void {}
}
