import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  nome: string;

  @OneToMany(() => Pedido, (p) => p.cliente)
  pedidos: Pedido[];

  @CreateDateColumn()
  criadoEm: Date;
}
