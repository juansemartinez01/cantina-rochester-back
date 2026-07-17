import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryStockActualDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  almacenId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  producto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  proveedorNombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cantidadMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cantidadMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  metadata?: boolean;
}
