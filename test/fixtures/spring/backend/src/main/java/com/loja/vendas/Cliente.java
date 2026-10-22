package com.loja.vendas;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clientes")
public class Cliente {
    @Id
    @GeneratedValue
    private Long id;

    @Column(unique = true, length = 255)
    private String email;

    private String nome;

    @Enumerated(EnumType.STRING)
    private StatusCliente status;

    @Column(precision = 12, scale = 2)
    private BigDecimal limite;

    @Column(nullable = true)
    private LocalDateTime ultimoAcesso;

    @OneToMany(mappedBy = "cliente")
    private List<Pedido> pedidos;
}
