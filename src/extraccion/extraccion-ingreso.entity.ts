// extraccion-ingreso.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CategoriaPago } from 'src/common/metodo-pago.enum';

@Entity('extraccion_ingreso')
export class ExtraccionIngreso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['EFECTIVO', 'BANCARIZADO'] })
  origen: CategoriaPago;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ length: 500 })
  motivo: string;

  @CreateDateColumn()
  fecha: Date;
}
