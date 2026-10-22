import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';

@Entity()
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cliente, (c) => c.pedidos)
  cliente: Cliente;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observacao?: string;
}
