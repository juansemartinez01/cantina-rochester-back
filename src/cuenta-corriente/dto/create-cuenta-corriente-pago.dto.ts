import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
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

export class CreateCuentaCorrientePagoDto {
  @Type(() => Number)
  @IsInt()
  almacenId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @Transform(({ value }) => normalizarMetodoPago(value))
  @IsIn(METODOS_PAGO, {
    message:
      'medioPago debe ser EFECTIVO, TRANSFERENCIA, DEBITO, CREDITO u OTRO',
  })
  medioPago: MetodoPago;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf(
    (p: CreateCuentaCorrientePagoDto) => p.medioPago === MetodoPago.OTRO,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(DETALLE_PAGO_MAX_LENGTH)
  detalle_pago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
