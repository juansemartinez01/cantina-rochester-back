import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsPositive, IsInt } from 'class-validator';
import {
  MetodoPago,
  METODOS_PAGO,
  normalizarMetodoPago,
} from 'src/common/metodo-pago.enum';

export class CreateIngresoVentaDto {
  @IsInt()
  ventaId: number;

  @Transform(({ value }) => normalizarMetodoPago(value))
  @IsIn(METODOS_PAGO, {
    message: 'tipo debe ser EFECTIVO, TRANSFERENCIA, DEBITO o CREDITO',
  })
  tipo: MetodoPago;

  @IsNumber()
  @IsPositive()
  monto: number;
}
