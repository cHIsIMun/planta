package com.loja.vendas;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EmailListener {
    @EventListener
    public void boasVindas(ClienteCadastrado evento) {
        System.out.println(evento.clienteId());
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void reenviarPendentes() {
    }
}
