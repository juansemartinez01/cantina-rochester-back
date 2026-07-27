import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  DETALLE_PAGO_MAX_LENGTH,
  MetodoPago,
  METODOS_PAGO,
  normalizarMetodoPago,
} from 'src/common/metodo-pago.enum';

export class CreateIngresoVentaDto {
  @IsInt()
  ventaId: number;

  @Transform(({ value }) => normalizarMetodoPago(value))
  @IsIn(METODOS_PAGO, {
    message: 'tipo debe ser EFECTIVO, TRANSFERENCIA, DEBITO, CREDITO u OTRO',
  })
  tipo: MetodoPago;

  @IsNumber()
  @IsPositive()
  monto: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((i: CreateIngresoVentaDto) => i.tipo === MetodoPago.OTRO)
  @IsString()
  @MinLength(3)
  @MaxLength(DETALLE_PAGO_MAX_LENGTH)
  detalle_pago?: string;
}
