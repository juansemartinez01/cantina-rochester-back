import { Venta } from "src/venta/venta.entity";
import {
  MetodoPagoPersistido,
  METODOS_PAGO_PERSISTIDOS,
} from "src/common/metodo-pago.enum";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('ingreso_venta')
export class IngresoVenta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venta, venta => venta.ingresos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @Column({ type: 'enum', enum: METODOS_PAGO_PERSISTIDOS })
  tipo: MetodoPagoPersistido;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @CreateDateColumn()
  fecha: Date;
}
