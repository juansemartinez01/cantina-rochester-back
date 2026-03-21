import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrecioHistorialTipo } from '../producto-precio-historial.entity';

export class QueryPrecioHistorialDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  productoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  almacenId?: number;

  @IsOptional()
  @IsEnum(PrecioHistorialTipo)
  tipo?: PrecioHistorialTipo;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
