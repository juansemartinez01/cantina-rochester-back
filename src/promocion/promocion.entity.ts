import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PromocionProducto } from './promocion-producto.entity';
import { Almacen } from 'src/almacen/almacen.entity';

@Entity('promocion')
@Index('idx_promocion_almacen', ['almacenId'])
export class Promocion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column('decimal')
  precioPromo: number;

  @Column({ name: 'almacen_id', type: 'int', nullable: true })
  almacenId: number | null;

  @ManyToOne(() => Almacen, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PromocionProducto, (pp) => pp.promocion, { cascade: true })
  productos: PromocionProducto[];

  @Column({ default: true })
  activo: boolean;
}
