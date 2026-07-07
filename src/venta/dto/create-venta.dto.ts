import {
  IsArray,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVentaItemDto } from './create-venta-item.dto';
import { CreateVentaPromoDto } from './create-venta-promo.dto';
import { CreateVentaPagoDto } from './create-venta-pago.dto';
import { CreateVentaAjusteDto } from './create-venta-ajuste.dto';

export class CreateVentaDto {
  @Type(() => Number)
  @IsInt()
  usuarioId: number;

  @Type(() => Number)
  @IsInt()
  almacenId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaPagoDto)
  pagos: CreateVentaPagoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaItemDto)
  items: CreateVentaItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaPromoDto)
  promociones?: CreateVentaPromoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaAjusteDto)
  ajustes?: CreateVentaAjusteDto[];
}
