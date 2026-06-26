import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AgregarMovimientoDto {
  @IsEnum(['INGRESO', 'EGRESO', 'RETIRO'])
  tipo: 'INGRESO' | 'EGRESO' | 'RETIRO';

  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
