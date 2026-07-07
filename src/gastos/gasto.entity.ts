import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenCompra } from 'src/orden-compra/orden-compra.entity';
import { Almacen } from 'src/almacen/almacen.entity';
import { GastoCategoria } from './gasto-categoria.entity';

export enum GastoOrigen {
  MANUAL = 'MANUAL',
  ORDEN_COMPRA = 'ORDEN_COMPRA',
}

@Entity('gasto')
@Index('idx_gasto_fecha', ['fecha'])
@Index('idx_gasto_monto', ['monto'])
@Index('idx_gasto_categoria', ['categoriaId'])
@Index('idx_gasto_almacen', ['almacenId'])
export class Gasto {
  @PrimaryGeneratedColumn()
  id: number;

  // Fecha del gasto (date puro para evitar líos de zona horaria)
  @Column({ type: 'date' })
  fecha: string; // 'YYYY-MM-DD'

  // Monto positivo con 2 decimales
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monto: string; // guardar como string por numeric de PG

  // Descripción breve
  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  // Campo opcional para notas largas
  @Column({ type: 'text', nullable: true })
  notas?: string | null;

  @Column({ name: 'categoria_id', type: 'int', nullable: true })
  categoriaId: number | null;

  @ManyToOne(() => GastoCategoria, categoria => categoria.gastos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: GastoCategoria | null;

  @Column({ name: 'almacen_id', type: 'int', nullable: true })
  almacenId: number | null;

  @ManyToOne(() => Almacen, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen | null;

  @Column({ type: 'enum', enum: GastoOrigen, default: GastoOrigen.MANUAL })
  origen: GastoOrigen;

  @Column({ name: 'orden_compra_id', type: 'int', nullable: true })
  ordenCompraId: number | null;

  @ManyToOne(() => OrdenCompra, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orden_compra_id' })
  ordenCompra: OrdenCompra | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
