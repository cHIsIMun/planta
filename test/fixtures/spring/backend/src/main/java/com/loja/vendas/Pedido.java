package com.loja.vendas;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class Pedido {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Cliente cliente;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;
}
