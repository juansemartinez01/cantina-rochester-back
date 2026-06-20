import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, Min } from 'class-validator';

export type MedioPagoVenta = 'EFECTIVO' | 'BANCARIZADO';

const MEDIO_PAGO_ALIASES: Record<string, MedioPagoVenta> = {
  EFECTIVO: 'EFECTIVO',
  CASH: 'EFECTIVO',
  BANCARIZADO: 'BANCARIZADO',
  TRANSFERENCIA: 'BANCARIZADO',
  TRANSFER: 'BANCARIZADO',
  DEBITO: 'BANCARIZADO',
  DEBIT: 'BANCARIZADO',
  CREDITO: 'BANCARIZADO',
  CREDIT: 'BANCARIZADO',
  QR: 'BANCARIZADO',
};

export function normalizarMedioPago(value: unknown): MedioPagoVenta | unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toUpperCase();
  return MEDIO_PAGO_ALIASES[normalized] ?? normalized;
}

export class CreateVentaPagoDto {
  @Transform(({ value }) => normalizarMedioPago(value))
  @IsIn(['EFECTIVO', 'BANCARIZADO'], {
    message:
      'medio debe ser EFECTIVO, BANCARIZADO o un alias bancarizado valido',
  })
  medio: MedioPagoVenta;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;
}
