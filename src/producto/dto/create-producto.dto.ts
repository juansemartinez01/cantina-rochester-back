import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  sku?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  unidad_id: number;

  @IsInt()
  @IsOptional()
  categoria_id?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  precioBase: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode: string;

  @IsBoolean()
  @IsOptional()
  es_por_gramos?: boolean;

  @IsBoolean()
  @IsOptional()
  inOferta?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  almacenId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  proveedorNombre?: string;
}
