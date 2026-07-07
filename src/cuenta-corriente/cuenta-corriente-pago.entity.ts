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
import { Almacen } from 'src/almacen/almacen.entity';
import { Usuario } from 'src/usuario/usuario.entity';
import { CuentaCorrientePagoAplicacion } from './cuenta-corriente-pago-aplicacion.entity';
import {
  MetodoPago,
  METODOS_PAGO_PERSISTIDOS,
} from 'src/common/metodo-pago.enum';

export enum CuentaCorrienteMedioPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  BANCARIZADO = 'BANCARIZADO',
}

@Entity('cuenta_corriente_pago')
export class CuentaCorrientePago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cuenta_corriente_id', type: 'int' })
  cuentaCorrienteId: number;

  @ManyToOne(() => CuentaCorriente, cuenta => cuenta.pagos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_corriente_id' })
  cuentaCorriente: CuentaCorriente;

  @Column({ name: 'almacen_id', type: 'int' })
  almacenId: number;

  @ManyToOne(() => Almacen, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'medio_pago', type: 'enum', enum: METODOS_PAGO_PERSISTIDOS })
  medioPago: MetodoPago | 'BANCARIZADO';

  @Column({ type: 'varchar', length: 120, nullable: true })
  referencia: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacion: string | null;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId: number | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @OneToMany(() => CuentaCorrientePagoAplicacion, aplicacion => aplicacion.pago)
  aplicaciones: CuentaCorrientePagoAplicacion[];

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;
}
