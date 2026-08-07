import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  DETALLE_PAGO_MAX_LENGTH,
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
      'medio debe ser EFECTIVO, TRANSFERENCIA, QR, DEBITO, CREDITO u OTRO',
  })
  medio: MedioPagoVenta;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((p: CreateVentaPagoDto) => p.medio === MetodoPago.OTRO)
  @IsString()
  @MinLength(3)
  @MaxLength(DETALLE_PAGO_MAX_LENGTH)
  detalle_pago?: string;
}
