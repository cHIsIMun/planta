import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cestas')
export class Cesta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clienteEmail: string;

  @Column('jsonb')
  itens: { produtoId: string; kg: number }[];

  @Column({ default: 'aberta' })
  status: string;

  @Column({ nullable: true })
  janelaEntrega?: string;

  @CreateDateColumn()
  criadaEm: Date;
}
