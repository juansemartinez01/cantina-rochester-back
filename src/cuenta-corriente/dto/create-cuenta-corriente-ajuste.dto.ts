import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CuentaCorrienteMovimientoTipo } from '../cuenta-corriente-movimiento.entity';

export class CreateCuentaCorrienteAjusteDto {
  @IsEnum([
    CuentaCorrienteMovimientoTipo.AJUSTE_DEBITO,
    CuentaCorrienteMovimientoTipo.AJUSTE_CREDITO,
  ])
  tipo:
    | CuentaCorrienteMovimientoTipo.AJUSTE_DEBITO
    | CuentaCorrienteMovimientoTipo.AJUSTE_CREDITO;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  descripcion: string;
}
