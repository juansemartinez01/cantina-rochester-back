import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CuentaCorrientePago } from './cuenta-corriente-pago.entity';
import { CuentaCorrienteVenta } from './cuenta-corriente-venta.entity';

@Entity('cuenta_corriente_pago_aplicacion')
export class CuentaCorrientePagoAplicacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pago_id', type: 'int' })
  pagoId: number;

  @ManyToOne(() => CuentaCorrientePago, pago => pago.aplicaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: CuentaCorrientePago;

  @Column({ name: 'cuenta_corriente_venta_id', type: 'int' })
  cuentaCorrienteVentaId: number;

  @ManyToOne(() => CuentaCorrienteVenta, venta => venta.aplicaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_corriente_venta_id' })
  cuentaCorrienteVenta: CuentaCorrienteVenta;

  @Column({ name: 'monto_aplicado', type: 'decimal', precision: 12, scale: 2 })
  montoAplicado: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;
}
