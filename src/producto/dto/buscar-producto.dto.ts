// src/producto/dto/buscar-producto.dto.ts
import { IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';

export class BuscarProductoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumberString()
  categoriaId?: string;

  @IsOptional()
  @IsNumberString()
  unidadId?: string;

  @IsOptional()
  @IsNumberString()
  almacenId?: string;

  @IsOptional()
  @IsString()
  conStock?: string; // se interpreta como booleano en el service

  @IsOptional()
  @IsDateString()
  precioUpdatedDesde?: string;

  @IsOptional()
  @IsDateString()
  precioUpdatedHasta?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
