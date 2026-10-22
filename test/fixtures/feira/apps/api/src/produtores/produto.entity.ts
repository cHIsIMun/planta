import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Produtor } from './produtor.entity';

export enum Estacao {
  Verao = 'verao',
  Outono = 'outono',
  Inverno = 'inverno',
  Primavera = 'primavera',
}

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precoKg: number;

  @Column({ type: 'enum', enum: Estacao })
  estacao: Estacao;

  @ManyToOne(() => Produtor, (p) => p.produtos)
  produtor: Produtor;
}
