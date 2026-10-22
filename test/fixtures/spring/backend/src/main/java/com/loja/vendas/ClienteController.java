package com.loja.vendas;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clientes")
public class ClienteController {
    private final ClienteService servico;

    public ClienteController(ClienteService servico) {
        this.servico = servico;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente criar(@RequestBody CriarClienteRequest pedido) {
        return servico.criar(pedido);
    }

    @GetMapping("/{id}")
    public Cliente buscar(@PathVariable Long id) {
        return servico.buscar(id);
    }

    @RequestMapping(value = "/busca", method = RequestMethod.GET)
    public Cliente buscarPorEmail(@RequestParam String email) {
        return servico.buscar(email);
    }
}
