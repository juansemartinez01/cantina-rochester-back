import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { VentaItem } from './venta-item.entity';
import { Usuario } from '../usuario/usuario.entity';
import { IngresoVenta } from 'src/ingreso/ingreso-venta.entity';
import { Almacen } from 'src/almacen/almacen.entity';
import { VentaAjuste } from './venta-ajuste.entity';
import { TipoCobroVenta } from './venta-tipo-cobro.enum';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'total_descuentos', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDescuentos: number;

  @Column({ name: 'total_recargos', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRecargos: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: string;

  @Column({
    name: 'tipo_cobro',
    type: 'varchar',
    length: 30,
    default: TipoCobroVenta.CONTADO,
  })
  tipoCobro: TipoCobroVenta;

  @Column({ name: 'cuenta_corriente_id', type: 'int', nullable: true })
  cuentaCorrienteId: number | null;

  @ManyToOne(() => Usuario, usuario => usuario.ventas, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => VentaItem, item => item.venta, { cascade: true, eager: true })
  items: VentaItem[];

  @OneToMany(() => VentaAjuste, ajuste => ajuste.venta, { cascade: true })
  ajustes: VentaAjuste[];

  @OneToMany(() => IngresoVenta, ingreso => ingreso.venta)
  ingresos: IngresoVenta[];

  @ManyToOne(() => Almacen, { nullable: false })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

}
