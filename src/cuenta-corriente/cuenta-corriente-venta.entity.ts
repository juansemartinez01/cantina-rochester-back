import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CuentaCorriente } from './cuenta-corriente.entity';
import { Venta } from 'src/venta/venta.entity';
import { CuentaCorrientePagoAplicacion } from './cuenta-corriente-pago-aplicacion.entity';

export enum CuentaCorrienteVentaEstado {
  PENDIENTE = 'PENDIENTE',
  PARCIAL = 'PARCIAL',
  PAGADA = 'PAGADA',
  ANULADA = 'ANULADA',
}

@Entity('cuenta_corriente_venta')
export class CuentaCorrienteVenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cuenta_corriente_id', type: 'int' })
  cuentaCorrienteId: number;

  @ManyToOne(() => CuentaCorriente, cuenta => cuenta.ventas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_corriente_id' })
  cuentaCorriente: CuentaCorriente;

  @Column({ name: 'venta_id', type: 'int' })
  ventaId: number;

  @ManyToOne(() => Venta, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ name: 'monto_original', type: 'decimal', precision: 12, scale: 2 })
  montoOriginal: number;

  @Column({ name: 'monto_pagado', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoPagado: number;

  @Column({ name: 'monto_pendiente', type: 'decimal', precision: 12, scale: 2 })
  montoPendiente: number;

  @Column({
    type: 'enum',
    enum: CuentaCorrienteVentaEstado,
    default: CuentaCorrienteVentaEstado.PENDIENTE,
  })
  estado: CuentaCorrienteVentaEstado;

  @OneToMany(() => CuentaCorrientePagoAplicacion, aplicacion => aplicacion.cuentaCorrienteVenta)
  aplicaciones: CuentaCorrientePagoAplicacion[];

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;
}
