import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  VentaAjusteModo,
  VentaAjusteOrigen,
  VentaAjusteTipo,
} from '../venta-ajuste.entity';

export class CreateVentaAjusteDto {
  @IsEnum(VentaAjusteTipo)
  tipo: VentaAjusteTipo;

  @IsEnum(VentaAjusteModo)
  modo: VentaAjusteModo;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  codigo?: string;

  @IsOptional()
  @IsEnum(VentaAjusteOrigen)
  origen?: VentaAjusteOrigen;
}
