import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AbrirCajaDto {
  @IsNumber()
  almacen_id: number;

  @IsNumber()
  @Min(0)
  monto_inicial: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
