import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Producto } from '../producto/producto.entity';
import { Almacen } from '../almacen/almacen.entity';

export enum PrecioHistorialTipo {
  BASE = 'BASE',
  OVERRIDE = 'OVERRIDE',
  OVERRIDE_REMOVED = 'OVERRIDE_REMOVED',
}

@Entity('producto_precio_historial')
@Index('ix_precio_hist_prod_fecha', ['producto_id', 'created_at'])
@Index('ix_precio_hist_alm_fecha', ['almacen_id', 'created_at'])
@Index('ix_precio_hist_tipo_fecha', ['tipo', 'created_at'])
export class ProductoPrecioHistorial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  producto_id: number;

  @ManyToOne(() => Producto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ nullable: true })
  almacen_id?: number | null;

  @ManyToOne(() => Almacen, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'almacen_id' })
  almacen?: Almacen | null;

  @Column({ type: 'varchar', length: 30 })
  tipo: PrecioHistorialTipo;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  precio_anterior?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  precio_nuevo?: string | null;

  // quién (lo resolvemos por DB usando req.user.id)
  @Column({ type: 'varchar', length: 80, nullable: true })
  usuario_id?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  usuario_nombre?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  origen?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
