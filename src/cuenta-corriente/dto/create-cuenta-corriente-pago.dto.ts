import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CuentaCorrienteMedioPago } from '../cuenta-corriente-pago.entity';

export class CreateCuentaCorrientePagoDto {
  @Type(() => Number)
  @IsInt()
  almacenId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @IsEnum(CuentaCorrienteMedioPago)
  medioPago: CuentaCorrienteMedioPago;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
