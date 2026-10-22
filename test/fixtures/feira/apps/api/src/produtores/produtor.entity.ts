import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Produto } from './produto.entity';

@Entity('produtores')
export class Produtor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nome: string;

  @Column()
  sitio: string;

  @OneToMany(() => Produto, (p) => p.produtor)
  produtos: Produto[];
}
