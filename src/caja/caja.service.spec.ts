import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CajaService } from './caja.service';
import {
  MovimientoCaja,
  MovimientoCajaOrigen,
} from './movimiento-caja.entity';

function createQueryBuilderMock(result: unknown) {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  if (Array.isArray(result) && result.length === 2 && Array.isArray(result[0])) {
    qb.getManyAndCount.mockResolvedValue(result);
  } else {
    qb.getRawMany.mockResolvedValue(result);
  }

  return qb;
}

describe('CajaService', () => {
  let service: CajaService;
  let sesionRepo: any;
  let movimientoRepo: any;
  let ingresoRepo: any;

  beforeEach(() => {
    sesionRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((value) => value),
      createQueryBuilder: jest.fn(),
    };
    movimientoRepo = {
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    ingresoRepo = {
      createQueryBuilder: jest.fn(),
    };

    service = new CajaService(sesionRepo, movimientoRepo, ingresoRepo);
  });

  it('agregarMovimiento crea movimientos manuales', async () => {
    sesionRepo.findOne.mockResolvedValue({ id: 10, estado: 'ABIERTA' });

    const result = await service.agregarMovimiento(
      10,
      {
        tipo: 'INGRESO',
        monto: 150,
        medio_pago: 'TRANSFERENCIA',
        motivo: 'Ingreso manual',
      },
      7,
    );

    expect(movimientoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        caja_id: 10,
        tipo: 'INGRESO',
        medio_pago: 'TRANSFERENCIA',
        origen: MovimientoCajaOrigen.MANUAL,
        cuenta_corriente_pago_id: null,
      }),
    );
    expect(result.origen).toBe(MovimientoCajaOrigen.MANUAL);
  });

  it('listarMovimientos aplica filtros y paginacion', async () => {
    sesionRepo.findOne.mockResolvedValue({ id: 10 });
    const movimientos = [{ id: 1, origen: MovimientoCajaOrigen.CUENTA_CORRIENTE }];
    const qb = createQueryBuilderMock([movimientos, 1]);
    movimientoRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.listarMovimientos(10, {
      origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
      tipo: 'INGRESO',
      medio_pago: 'TRANSFERENCIA',
      page: '2',
      limit: '10',
      order: 'ASC',
    });

    expect(qb.where).toHaveBeenCalledWith('movimiento.caja_id = :cajaId', {
      cajaId: 10,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('movimiento.origen = :origen', {
      origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('movimiento.tipo = :tipo', {
      tipo: 'INGRESO',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'movimiento.medio_pago = :medioPago',
      { medioPago: 'TRANSFERENCIA' },
    );
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      data: movimientos,
      meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('getReporte separa ventas, cuenta corriente y movimientos manuales', async () => {
    sesionRepo.findOne.mockResolvedValue({
      id: 5,
      estado: 'ABIERTA',
      almacen_id: 3,
      usuario_id: 7,
      monto_inicial: 1000,
      fecha_apertura: new Date('2026-07-20T10:00:00Z'),
      fecha_cierre: null,
    });

    ingresoRepo.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock([
        { tipo: 'EFECTIVO', total: '100' },
        { tipo: 'TRANSFERENCIA', total: '50' },
      ]),
    );
    movimientoRepo.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock([
        {
          origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
          tipo: 'INGRESO',
          medio_pago: 'EFECTIVO',
          total: '20',
        },
        {
          origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
          tipo: 'INGRESO',
          medio_pago: 'TRANSFERENCIA',
          total: '30',
        },
        {
          origen: MovimientoCajaOrigen.MANUAL,
          tipo: 'INGRESO',
          medio_pago: 'EFECTIVO',
          total: '10',
        },
        {
          origen: MovimientoCajaOrigen.MANUAL,
          tipo: 'EGRESO',
          medio_pago: 'EFECTIVO',
          total: '5',
        },
        {
          origen: MovimientoCajaOrigen.MANUAL,
          tipo: 'RETIRO',
          medio_pago: 'TRANSFERENCIA',
          total: '7',
        },
      ]),
    );

    const result: any = await service.getReporte(5);

    expect(result.reporte.cobros_ventas).toMatchObject({
      efectivo: '100.00',
      transferencia: '50.00',
      bancarizado: '50.00',
      total: '150.00',
    });
    expect(result.reporte.cobros_cuenta_corriente).toMatchObject({
      efectivo: '20.00',
      transferencia: '30.00',
      bancarizado: '30.00',
      total: '50.00',
    });
    expect(result.reporte.movimientos_manuales.ingresos).toMatchObject({
      efectivo: '10.00',
      total: '10.00',
    });
    expect(result.reporte.movimientos_manuales.egresos).toMatchObject({
      efectivo: '5.00',
      total: '5.00',
    });
    expect(result.reporte.movimientos_manuales.retiros).toMatchObject({
      transferencia: '7.00',
      total: '7.00',
    });
    expect(result.reporte.ingresos_manuales).toBe('10.00');
    expect(result.reporte.efectivo_esperado).toBe('1125.00');
  });

  it('anularMovimiento bloquea movimientos de cuenta corriente', async () => {
    movimientoRepo.findOne.mockResolvedValue({
      id: 99,
      anulado: false,
      origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
    });

    await expect(
      service.anularMovimiento(99, { motivo_anulacion: 'test' }, 7),
    ).rejects.toThrow(BadRequestException);
    expect(movimientoRepo.save).not.toHaveBeenCalled();
  });

  it('anularMovimiento permite movimientos manuales', async () => {
    const movimiento: Partial<MovimientoCaja> = {
      id: 88,
      anulado: false,
      origen: MovimientoCajaOrigen.MANUAL,
    };
    movimientoRepo.findOne.mockResolvedValue(movimiento);

    const result = await service.anularMovimiento(
      88,
      { motivo_anulacion: 'Carga duplicada' },
      7,
    );

    expect(movimientoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        anulado: true,
        motivo_anulacion: 'Carga duplicada',
        anulado_por_id: 7,
      }),
    );
    expect(result.anulado).toBe(true);
  });

  it('listarMovimientos falla si la caja no existe', async () => {
    sesionRepo.findOne.mockResolvedValue(null);

    await expect(service.listarMovimientos(123, {})).rejects.toThrow(
      NotFoundException,
    );
  });
});
