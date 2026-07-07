import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AnularOrdenCompraDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivoAnulacion: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;
}
