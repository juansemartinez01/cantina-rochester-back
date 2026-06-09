// src/producto/dto/buscar-producto.dto.ts
import {
  IsOptional,
  IsString,
  IsNumberString,
  IsDateString,
  IsBooleanString,
  IsIn,
} from 'class-validator';

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
  @IsBooleanString()
  sinFechaPrecio?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsBooleanString()
  inOferta?: string;

  @IsOptional()
  @IsIn(['precioFinal'])
  sortBy?: 'precioFinal';

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
}
