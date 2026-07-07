// dto/filtro-ingreso-venta.dto.ts
import { IsOptional, IsIn, IsNumber, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  MetodoPagoPersistido,
  METODOS_PAGO_PERSISTIDOS,
  normalizarFiltroMetodoPago,
} from 'src/common/metodo-pago.enum';

export class FiltroIngresoVentaDto {
  @IsOptional()
  @Transform(({ value }) => normalizarFiltroMetodoPago(value))
  @IsIn(METODOS_PAGO_PERSISTIDOS)
  tipo?: MetodoPagoPersistido;

  @IsOptional()
  @Type(() => Number)
  ventaId?: number;

  @IsOptional()
  @Type(() => Number)
  montoMin?: number;

  @IsOptional()
  @Type(() => Number)
  montoMax?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
