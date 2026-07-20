import { MovimientoCajaOrigen } from '../movimiento-caja.entity';
import { MetodoPagoPersistido } from 'src/common/metodo-pago.enum';

export type MovimientoCajaTipo = 'INGRESO' | 'EGRESO' | 'RETIRO';
export type OrdenMovimientoCaja = 'ASC' | 'DESC';

export class FiltroMovimientoCajaDto {
  origen?: MovimientoCajaOrigen;
  tipo?: MovimientoCajaTipo;
  medio_pago?: MetodoPagoPersistido;
  page?: number | string;
  limit?: number | string;
  order?: OrdenMovimientoCaja;
}
