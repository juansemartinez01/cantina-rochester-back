import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, Min } from 'class-validator';
import {
  MetodoPago,
  METODOS_PAGO,
  normalizarMetodoPago,
} from 'src/common/metodo-pago.enum';

export type MedioPagoVenta = MetodoPago;
export const normalizarMedioPago = normalizarMetodoPago;

export class CreateVentaPagoDto {
  @Transform(({ value }) => normalizarMedioPago(value))
  @IsIn(METODOS_PAGO, {
    message:
      'medio debe ser EFECTIVO, TRANSFERENCIA, DEBITO o CREDITO',
  })
  medio: MedioPagoVenta;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;
}
