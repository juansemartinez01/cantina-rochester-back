import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import {
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
      'medio_pago debe ser EFECTIVO, TRANSFERENCIA, DEBITO o CREDITO',
  })
  medio_pago?: MetodoPago;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
