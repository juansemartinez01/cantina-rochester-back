import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from 'src/usuario/usuario.entity';
import { SesionCaja } from './sesion-caja.entity';
import {
  MetodoPagoPersistido,
  METODOS_PAGO_PERSISTIDOS,
} from 'src/common/metodo-pago.enum';

@Entity('movimiento_caja')
export class MovimientoCaja {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SesionCaja, caja => caja.movimientos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caja_id' })
  caja: SesionCaja;

  @Column({ name: 'caja_id' })
  caja_id: number;

  @Column({ type: 'enum', enum: ['INGRESO', 'EGRESO', 'RETIRO'] })
  tipo: 'INGRESO' | 'EGRESO' | 'RETIRO';

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({
    name: 'medio_pago',
    type: 'enum',
    enum: METODOS_PAGO_PERSISTIDOS,
    default: 'EFECTIVO',
  })
  medio_pago: MetodoPagoPersistido;

  @Column({ length: 500 })
  motivo: string;

  @Column({ length: 500, nullable: true })
  observacion: string | null;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ default: false })
  anulado: boolean;

  @Column({ length: 500, nullable: true })
  motivo_anulacion: string | null;

  @ManyToOne(() => Usuario, { nullable: true, eager: false })
  @JoinColumn({ name: 'anulado_por_id' })
  anulado_por: Usuario | null;

  @Column({ name: 'anulado_por_id', nullable: true })
  anulado_por_id: number | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_anulacion: Date | null;
}
