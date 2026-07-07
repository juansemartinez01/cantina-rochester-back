import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
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
      'medioPago debe ser EFECTIVO, TRANSFERENCIA, DEBITO o CREDITO',
  })
  medioPago: MetodoPago;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
