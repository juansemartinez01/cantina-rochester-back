import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class CreateVentaItemDto {
  @Type(() => Number)
  @IsInt()
  productoId: number;

  // Solo para productos por pieza
  @ValidateIf((o) => o.cantidad_gramos == null)
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;

  // Solo para productos por gramos
  @ValidateIf((o) => o.cantidad == null)
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidad_gramos?: number;

  // El backend recalcula el precio final; se acepta para compatibilidad.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario?: number;
}
