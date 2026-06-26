import { IsNumber, Min } from 'class-validator';

export class CerrarCajaDto {
  @IsNumber()
  @Min(0)
  efectivo_contado: number;
}
