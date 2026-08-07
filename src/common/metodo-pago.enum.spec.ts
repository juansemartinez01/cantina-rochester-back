import {
  MetodoPago,
  esMetodoPagoBancarizado,
  metodosParaFiltroPago,
  normalizarMetodoPago,
} from './metodo-pago.enum';

describe('metodo-pago enum helpers', () => {
  it('normaliza QR como metodo canonico propio', () => {
    expect(normalizarMetodoPago('qr')).toBe(MetodoPago.QR);
  });

  it('considera QR dentro de bancarizado', () => {
    expect(esMetodoPagoBancarizado(MetodoPago.QR)).toBe(true);
    expect(metodosParaFiltroPago('BANCARIZADO')).toContain(MetodoPago.QR);
  });
});
