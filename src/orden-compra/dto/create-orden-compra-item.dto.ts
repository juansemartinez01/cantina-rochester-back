// src/orden-compra/dto/create-orden-compra-item.dto.ts
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class CreateOrdenCompraItemDto {
  @IsInt()
  @Type(() => Number)
  productoId: number;

  // Solo para productos por pieza
  @ValidateIf(o => o.cantidad_gramos == null)
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  cantidad?: number;

  // Solo para productos por gramos (usar gramos, ej: 1250 => 1.250 kg)
  @ValidateIf(o => o.cantidad == null)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  @Min(0.001)
  cantidad_gramos?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  precioUnitario: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}
