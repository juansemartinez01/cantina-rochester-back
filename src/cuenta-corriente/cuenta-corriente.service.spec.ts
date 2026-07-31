import { BadRequestException } from '@nestjs/common';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { CuentaCorriente } from './cuenta-corriente.entity';
import {
  CuentaCorrienteVenta,
  CuentaCorrienteVentaEstado,
} from './cuenta-corriente-venta.entity';
import { CuentaCorrientePago } from './cuenta-corriente-pago.entity';
import { CuentaCorrientePagoAplicacion } from './cuenta-corriente-pago-aplicacion.entity';
import {
  CuentaCorrienteMovimiento,
  CuentaCorrienteMovimientoTipo,
} from './cuenta-corriente-movimiento.entity';
import { SesionCaja } from 'src/caja/sesion-caja.entity';
import {
  MovimientoCaja,
  MovimientoCajaOrigen,
} from 'src/caja/movimiento-caja.entity';
import { MetodoPago } from 'src/common/metodo-pago.enum';

function lockedCuentaQueryBuilder(cuenta: unknown) {
  return {
    where: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(cuenta),
  };
}

describe('CuentaCorrienteService', () => {
  let service: CuentaCorrienteService;
  let sesionCajaRepo: any;
  let cuentaRepo: any;
  let cuentaVentaRepo: any;
  let cuentaMovimientoRepo: any;
  let cuentaPagoRepo: any;
  let cuentaPagoAplicacionRepo: any;
  let movimientoCajaRepo: any;
  let manager: any;

  beforeEach(() => {
    sesionCajaRepo = {
      findOne: jest.fn(),
    };
    cuentaRepo = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(async (value) => value),
    };
    cuentaVentaRepo = {
      save: jest.fn(async (value) => ({ id: 33, ...value })),
    };
    cuentaMovimientoRepo = {
      save: jest.fn(async (value) => value),
    };
    cuentaPagoRepo = {
      save: jest.fn(async (value) => ({ id: 44, ...value })),
    };
    cuentaPagoAplicacionRepo = {
      save: jest.fn(async (value) => ({ id: 55, ...value })),
    };
    movimientoCajaRepo = {
      save: jest.fn(async (value) => ({ id: 66, ...value })),
    };

    const repositories = new Map<any, any>([
      [SesionCaja, sesionCajaRepo],
      [CuentaCorriente, cuentaRepo],
      [CuentaCorrienteVenta, cuentaVentaRepo],
      [CuentaCorrienteMovimiento, cuentaMovimientoRepo],
      [CuentaCorrientePago, cuentaPagoRepo],
      [CuentaCorrientePagoAplicacion, cuentaPagoAplicacionRepo],
      [MovimientoCaja, movimientoCajaRepo],
    ]);

    manager = {
      getRepository: jest.fn((entity) => repositories.get(entity)),
    };

    service = new CuentaCorrienteService(
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
    );
  });

  it('exige caja abierta para ventas a cuenta corriente aunque no haya pago inicial', async () => {
    sesionCajaRepo.findOne.mockResolvedValue(null);

    await expect(
      service.registrarVentaCuentaCorrienteTx({
        manager,
        cuentaCorrienteId: 10,
        venta: { id: 20 } as any,
        almacenId: 1,
        total: 1000,
        pagos: [],
        usuarioId: 7,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(sesionCajaRepo.findOne).toHaveBeenCalledWith({
      where: { almacen_id: 1, estado: 'ABIERTA' },
    });
    expect(cuentaRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('crea movimiento de caja informativo con monto cero para venta a cuenta corriente sin pago', async () => {
    sesionCajaRepo.findOne.mockResolvedValue({ id: 5 });
    cuentaRepo.createQueryBuilder.mockReturnValue(
      lockedCuentaQueryBuilder({
        id: 10,
        nombre: 'Cliente Test',
        activa: true,
        saldoActual: 200,
      }),
    );

    const result = await service.registrarVentaCuentaCorrienteTx({
      manager,
      cuentaCorrienteId: 10,
      venta: { id: 20 } as any,
      almacenId: 1,
      total: 1000,
      pagos: [],
      usuarioId: 7,
    });

    expect(cuentaVentaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        cuentaCorrienteId: 10,
        ventaId: 20,
        montoOriginal: 1000,
        montoPagado: 0,
        montoPendiente: 1000,
        estado: CuentaCorrienteVentaEstado.PENDIENTE,
      }),
    );
    expect(cuentaMovimientoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        cuentaCorrienteId: 10,
        tipo: CuentaCorrienteMovimientoTipo.DEUDA,
        monto: 1000,
        saldoResultante: 1200,
      }),
    );
    expect(movimientoCajaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        caja_id: 5,
        tipo: 'INGRESO',
        medio_pago: MetodoPago.EFECTIVO,
        origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
        cuenta_corriente_pago_id: null,
        monto: 0,
        motivo: 'Venta a cuenta corriente #20 - Cliente Test',
        observacion:
          'Deuda generada: 1000.00 | Pagado inicial: 0.00 | Pendiente: 1000.00',
        usuario_id: 7,
        anulado: false,
      }),
    );
    expect(result.movimientoCaja).toEqual(
      expect.objectContaining({
        id: 66,
        monto: 0,
        origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
      }),
    );
  });

  it('crea movimiento informativo tambien cuando hay pago inicial', async () => {
    sesionCajaRepo.findOne.mockResolvedValue({ id: 5 });
    cuentaRepo.createQueryBuilder.mockReturnValue(
      lockedCuentaQueryBuilder({
        id: 10,
        nombre: 'Cliente Test',
        activa: true,
        saldoActual: 0,
      }),
    );

    await service.registrarVentaCuentaCorrienteTx({
      manager,
      cuentaCorrienteId: 10,
      venta: { id: 20 } as any,
      almacenId: 1,
      total: 1000,
      pagos: [{ medio: MetodoPago.EFECTIVO, monto: 300 }],
      usuarioId: 7,
    });

    expect(cuentaPagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        cuentaCorrienteId: 10,
        almacenId: 1,
        monto: 300,
        medioPago: MetodoPago.EFECTIVO,
      }),
    );
    expect(movimientoCajaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        caja_id: 5,
        monto: 0,
        cuenta_corriente_pago_id: null,
        observacion:
          'Deuda generada: 1000.00 | Pagado inicial: 300.00 | Pendiente: 700.00',
      }),
    );
  });
});
