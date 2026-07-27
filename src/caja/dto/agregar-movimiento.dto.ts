import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  DETALLE_PAGO_MAX_LENGTH,
  MetodoPago,
  METODOS_PAGO,
  normalizarMetodoPago,
} from 'src/common/metodo-pago.enum';

export class AgregarMovimientoDto {
  @IsEnum(['INGRESO', 'EGRESO', 'RETIRO'])
  tipo: 'INGRESO' | 'EGRESO' | 'RETIRO';

  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsOptional()
  @Transform(({ value }) => normalizarMetodoPago(value))
  @IsEnum(METODOS_PAGO, {
    message:
      'medio_pago debe ser EFECTIVO, TRANSFERENCIA, DEBITO, CREDITO u OTRO',
  })
  medio_pago?: MetodoPago;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((m: AgregarMovimientoDto) => m.medio_pago === MetodoPago.OTRO)
  @IsString()
  @MinLength(3)
  @MaxLength(DETALLE_PAGO_MAX_LENGTH)
  detalle_pago?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
