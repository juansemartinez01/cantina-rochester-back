export const MetodoPago = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO',
} as const;

export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

export const METODOS_PAGO = Object.values(MetodoPago);
export const METODOS_PAGO_BANCARIZADOS = [
  MetodoPago.TRANSFERENCIA,
  MetodoPago.DEBITO,
  MetodoPago.CREDITO,
] as const;
export const METODOS_PAGO_PERSISTIDOS = [
  ...METODOS_PAGO,
  'BANCARIZADO',
] as const;

export type MetodoPagoPersistido = (typeof METODOS_PAGO_PERSISTIDOS)[number];
export type CategoriaPago = 'EFECTIVO' | 'BANCARIZADO';

const METODO_PAGO_ALIASES: Record<string, MetodoPago> = {
  EFECTIVO: MetodoPago.EFECTIVO,
  CASH: MetodoPago.EFECTIVO,
  TRANSFERENCIA: MetodoPago.TRANSFERENCIA,
  TRANSFER: MetodoPago.TRANSFERENCIA,
  TRANSFERENCIAS: MetodoPago.TRANSFERENCIA,
  BANCARIZADO: MetodoPago.TRANSFERENCIA,
  DEBITO: MetodoPago.DEBITO,
  DEBIT: MetodoPago.DEBITO,
  CREDITO: MetodoPago.CREDITO,
  CREDIT: MetodoPago.CREDITO,
  QR: MetodoPago.TRANSFERENCIA,
};

export function normalizarMetodoPago(value: unknown): MetodoPago | unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toUpperCase();
  return METODO_PAGO_ALIASES[normalized] ?? normalized;
}

export function normalizarFiltroMetodoPago(
  value: unknown,
): MetodoPagoPersistido | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  const normalized = value.trim().toUpperCase();
  if (normalized === 'BANCARIZADO') return 'BANCARIZADO';

  const metodo = normalizarMetodoPago(normalized);
  return esMetodoPagoPersistido(metodo) ? metodo : undefined;
}

export function esMetodoPago(value: unknown): value is MetodoPago {
  return METODOS_PAGO.includes(value as MetodoPago);
}

export function esMetodoPagoPersistido(
  value: unknown,
): value is MetodoPagoPersistido {
  return METODOS_PAGO_PERSISTIDOS.includes(value as MetodoPagoPersistido);
}

export function esMetodoPagoBancarizado(value: unknown): boolean {
  return (
    value === 'BANCARIZADO' ||
    METODOS_PAGO_BANCARIZADOS.includes(value as any)
  );
}

export function categoriaMetodoPago(value: unknown): CategoriaPago {
  return value === MetodoPago.EFECTIVO ? 'EFECTIVO' : 'BANCARIZADO';
}

export function metodosParaFiltroPago(
  value?: MetodoPagoPersistido,
): MetodoPagoPersistido[] {
  if (!value) return [];
  if (value === 'BANCARIZADO') {
    return ['BANCARIZADO', ...METODOS_PAGO_BANCARIZADOS];
  }
  return [value];
}
