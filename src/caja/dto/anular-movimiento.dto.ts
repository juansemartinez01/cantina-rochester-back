import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnularMovimientoDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  motivo_anulacion: string;
}
