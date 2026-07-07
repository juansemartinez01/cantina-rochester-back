import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGastoDto {
  @IsDateString({}, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha: string;

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({}, { message: 'monto debe ser numérico' })
  @IsPositive({ message: 'monto debe ser > 0' })
  monto: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  descripcion: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== null && value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(1)
  categoriaId?: number | null;
}
