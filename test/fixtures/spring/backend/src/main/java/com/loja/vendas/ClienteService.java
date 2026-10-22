package com.loja.vendas;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class ClienteService {
    private final ClienteRepository repositorio;
    private final ApplicationEventPublisher eventos;

    public ClienteService(ClienteRepository repositorio, ApplicationEventPublisher eventos) {
        this.repositorio = repositorio;
        this.eventos = eventos;
    }

    public Cliente criar(CriarClienteRequest pedido) {
        Cliente cliente = new Cliente();
        Cliente salvo = repositorio.save(cliente);
        eventos.publishEvent(new ClienteCadastrado(1L));
        return salvo;
    }

    public Cliente buscar(Long id) {
        return repositorio.findById(id).orElse(null);
    }

    public Cliente buscar(String email) {
        return repositorio.findByEmail(email);
    }
}
