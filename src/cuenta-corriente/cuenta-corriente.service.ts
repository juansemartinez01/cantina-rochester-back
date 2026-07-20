import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { CuentaCorriente } from './cuenta-corriente.entity';
import {
  CuentaCorrienteVenta,
  CuentaCorrienteVentaEstado,
} from './cuenta-corriente-venta.entity';
import { CuentaCorrientePago } from './cuenta-corriente-pago.entity';
import {
  CuentaCorrienteMovimiento,
  CuentaCorrienteMovimientoTipo,
} from './cuenta-corriente-movimiento.entity';
import { CreateCuentaCorrienteDto } from './dto/create-cuenta-corriente.dto';
import { UpdateCuentaCorrienteDto } from './dto/update-cuenta-corriente.dto';
import { FiltroCuentaCorrienteDto } from './dto/filtro-cuenta-corriente.dto';
import { FiltroCuentaCorrienteDetalleDto } from './dto/filtro-cuenta-corriente-detalle.dto';
import { CreateCuentaCorrientePagoDto } from './dto/create-cuenta-corriente-pago.dto';
import { CreateCuentaCorrienteAjusteDto } from './dto/create-cuenta-corriente-ajuste.dto';
import { SesionCaja } from 'src/caja/sesion-caja.entity';
import {
  MovimientoCaja,
  MovimientoCajaOrigen,
} from 'src/caja/movimiento-caja.entity';
import { CuentaCorrientePagoAplicacion } from './cuenta-corriente-pago-aplicacion.entity';
import { Venta } from 'src/venta/venta.entity';
import { MetodoPago } from 'src/common/metodo-pago.enum';

@Injectable()
export class CuentaCorrienteService {
  constructor(
    @InjectRepository(CuentaCorriente)
    private readonly cuentaRepo: Repository<CuentaCorriente>,
    @InjectRepository(CuentaCorrienteVenta)
    private readonly ventaRepo: Repository<CuentaCorrienteVenta>,
    @InjectRepository(CuentaCorrientePago)
    private readonly pagoRepo: Repository<CuentaCorrientePago>,
    @InjectRepository(CuentaCorrienteMovimiento)
    private readonly movimientoRepo: Repository<CuentaCorrienteMovimiento>,
    private readonly dataSource: DataSource,
  ) {}

  async crear(dto: CreateCuentaCorrienteDto): Promise<CuentaCorriente> {
    const documento = this.clean(dto.documento);
    if (documento) {
      await this.assertDocumentoDisponible(documento);
    }

    const cuenta = this.cuentaRepo.create({
      nombre: dto.nombre.trim(),
      documento,
      email: this.clean(dto.email),
      telefono: this.clean(dto.telefono),
      observaciones: this.clean(dto.observaciones),
      activa: true,
      saldoActual: 0,
    });

    return this.cuentaRepo.save(cuenta);
  }

  async listar(filtro: FiltroCuentaCorrienteDto) {
    const {
      search,
      documento,
      activa,
      page = 1,
      limit = 50,
      orderBy = 'nombre',
      order = 'ASC',
    } = filtro;

    const qb = this.cuentaRepo.createQueryBuilder('cuenta');

    if (search?.trim()) {
      qb.andWhere(
        '(cuenta.nombre ILIKE :search OR cuenta.documento ILIKE :search OR cuenta.email ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (documento?.trim()) {
      qb.andWhere('cuenta.documento ILIKE :documento', {
        documento: `%${documento.trim()}%`,
      });
    }

    if (activa === 'true') {
      qb.andWhere('cuenta.activa = true');
    } else if (activa === 'false') {
      qb.andWhere('cuenta.activa = false');
    }

    const orderMap: Record<string, string> = {
      nombre: 'cuenta.nombre',
      saldoActual: 'cuenta.saldo_actual',
      createdAt: 'cuenta.created_at',
    };

    const limitFinal = Math.min(limit, 200);
    const [data, total] = await qb
      .orderBy(orderMap[orderBy], order)
      .addOrderBy('cuenta.id', 'ASC')
      .skip((page - 1) * limitFinal)
      .take(limitFinal)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit: limitFinal,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limitFinal),
      },
    };
  }

  async obtenerPorId(id: number): Promise<CuentaCorriente> {
    const cuenta = await this.cuentaRepo.findOne({ where: { id } });
    if (!cuenta) {
      throw new NotFoundException(`Cuenta corriente ${id} no encontrada`);
    }
    return cuenta;
  }

  async actualizar(
    id: number,
    dto: UpdateCuentaCorrienteDto,
  ): Promise<CuentaCorriente> {
    const cuenta = await this.obtenerPorId(id);
    const documento = this.clean(dto.documento);

    if (documento !== undefined && documento !== cuenta.documento) {
      await this.assertDocumentoDisponible(documento, id);
    }

    if (dto.nombre !== undefined) cuenta.nombre = dto.nombre.trim();
    if (dto.documento !== undefined) cuenta.documento = documento;
    if (dto.email !== undefined) cuenta.email = this.clean(dto.email);
    if (dto.telefono !== undefined) cuenta.telefono = this.clean(dto.telefono);
    if (dto.observaciones !== undefined) {
      cuenta.observaciones = this.clean(dto.observaciones);
    }
    if (dto.activa !== undefined) cuenta.activa = dto.activa;

    await this.cuentaRepo.save(cuenta);
    return this.obtenerPorId(id);
  }

  async desactivar(id: number): Promise<CuentaCorriente> {
    const cuenta = await this.obtenerPorId(id);
    cuenta.activa = false;
    return this.cuentaRepo.save(cuenta);
  }

  async obtenerResumen(id: number) {
    const cuenta = await this.obtenerPorId(id);

    const [ventasRaw, pagosRaw, movimientosCount, ultimoMovimiento] =
      await Promise.all([
        this.ventaRepo
          .createQueryBuilder('venta')
          .select('COUNT(*)', 'cantidadVentas')
          .addSelect('COALESCE(SUM(venta.monto_original), 0)', 'montoOriginal')
          .addSelect('COALESCE(SUM(venta.monto_pagado), 0)', 'montoPagado')
          .addSelect('COALESCE(SUM(venta.monto_pendiente), 0)', 'montoPendiente')
          .where('venta.cuenta_corriente_id = :id', { id })
          .getRawOne(),
        this.pagoRepo
          .createQueryBuilder('pago')
          .select('COUNT(*)', 'cantidadPagos')
          .addSelect('COALESCE(SUM(pago.monto), 0)', 'totalPagado')
          .where('pago.cuenta_corriente_id = :id', { id })
          .getRawOne(),
        this.movimientoRepo.count({ where: { cuentaCorrienteId: id } }),
        this.movimientoRepo.findOne({
          where: { cuentaCorrienteId: id },
          order: { fecha: 'DESC', id: 'DESC' },
        }),
      ]);

    const estados = await this.ventaRepo
      .createQueryBuilder('venta')
      .select('venta.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('venta.cuenta_corriente_id = :id', { id })
      .groupBy('venta.estado')
      .getRawMany();

    return {
      cuenta,
      saldoActual: Number(cuenta.saldoActual ?? 0),
      ventas: {
        cantidad: Number(ventasRaw?.cantidadVentas ?? 0),
        montoOriginal: Number(ventasRaw?.montoOriginal ?? 0),
        montoPagado: Number(ventasRaw?.montoPagado ?? 0),
        montoPendiente: Number(ventasRaw?.montoPendiente ?? 0),
        estados: estados.reduce<Record<string, number>>((acc, row) => {
          acc[row.estado] = Number(row.cantidad ?? 0);
          return acc;
        }, {}),
      },
      pagos: {
        cantidad: Number(pagosRaw?.cantidadPagos ?? 0),
        total: Number(pagosRaw?.totalPagado ?? 0),
      },
      movimientos: {
        cantidad: movimientosCount,
        ultimo: ultimoMovimiento,
      },
    };
  }

  async listarVentas(id: number, filtro: FiltroCuentaCorrienteDetalleDto) {
    await this.obtenerPorId(id);
    const { page = 1, limit = 50, order = 'DESC' } = filtro;
    const limitFinal = Math.min(limit, 200);

    const [data, total] = await this.ventaRepo.findAndCount({
      where: { cuentaCorrienteId: id },
      relations: [
        'venta',
        'venta.items',
        'venta.items.producto',
        'venta.items.producto.unidad',
        'venta.items.producto.categoria',
        'venta.almacen',
      ],
      order: { fecha: order, id: order },
      skip: (page - 1) * limitFinal,
      take: limitFinal,
    });

    return {
      data,
      meta: {
        page,
        limit: limitFinal,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limitFinal),
      },
    };
  }

  async listarMovimientos(
    id: number,
    filtro: FiltroCuentaCorrienteDetalleDto,
  ) {
    await this.obtenerPorId(id);
    const { page = 1, limit = 50, order = 'DESC' } = filtro;
    const limitFinal = Math.min(limit, 200);

    const [data, total] = await this.movimientoRepo.findAndCount({
      where: { cuentaCorrienteId: id },
      relations: ['venta', 'pago', 'usuario'],
      order: { fecha: order, id: order },
      skip: (page - 1) * limitFinal,
      take: limitFinal,
    });

    return {
      data,
      meta: {
        page,
        limit: limitFinal,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limitFinal),
      },
    };
  }

  async registrarPago(
    cuentaId: number,
    dto: CreateCuentaCorrientePagoDto,
    usuarioId?: number,
  ) {
    const montoPago = this.to2(Number(dto.monto));
    if (!Number.isFinite(montoPago) || montoPago <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const cuentaRepo = manager.getRepository(CuentaCorriente);
      const cuenta = await cuentaRepo
        .createQueryBuilder('cuenta')
        .where('cuenta.id = :cuentaId', { cuentaId })
        .setLock('pessimistic_write')
        .getOne();

      if (!cuenta) {
        throw new NotFoundException(
          `Cuenta corriente ${cuentaId} no encontrada`,
        );
      }

      const caja = await manager.getRepository(SesionCaja).findOne({
        where: { almacen_id: dto.almacenId, estado: 'ABIERTA' },
      });

      if (!caja) {
        throw new BadRequestException(
          `No hay caja abierta para el almacen ${dto.almacenId}`,
        );
      }

      const pago = await manager.getRepository(CuentaCorrientePago).save({
        cuentaCorrienteId: cuenta.id,
        almacenId: dto.almacenId,
        monto: montoPago,
        medioPago: dto.medioPago,
        referencia: this.clean(dto.referencia) ?? null,
        observacion: this.clean(dto.observacion) ?? null,
        usuarioId: usuarioId ?? null,
      });

      let restante = montoPago;
      const aplicaciones: CuentaCorrientePagoAplicacion[] = [];
      const ventasActualizadas: CuentaCorrienteVenta[] = [];

      const ventasPendientes = await manager
        .getRepository(CuentaCorrienteVenta)
        .createQueryBuilder('ccv')
        .where('ccv.cuenta_corriente_id = :cuentaId', { cuentaId })
        .andWhere('ccv.estado IN (:...estados)', {
          estados: [
            CuentaCorrienteVentaEstado.PENDIENTE,
            CuentaCorrienteVentaEstado.PARCIAL,
          ],
        })
        .andWhere('ccv.monto_pendiente > 0')
        .orderBy('ccv.fecha', 'ASC')
        .addOrderBy('ccv.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      for (const venta of ventasPendientes) {
        if (restante <= 0) break;

        const pendiente = this.to2(Number(venta.montoPendiente ?? 0));
        if (pendiente <= 0) continue;

        const montoAplicado = this.to2(Math.min(restante, pendiente));
        venta.montoPagado = this.to2(
          Number(venta.montoPagado ?? 0) + montoAplicado,
        );
        venta.montoPendiente = this.to2(pendiente - montoAplicado);
        venta.estado =
          venta.montoPendiente <= 0
            ? CuentaCorrienteVentaEstado.PAGADA
            : CuentaCorrienteVentaEstado.PARCIAL;

        ventasActualizadas.push(venta);
        aplicaciones.push(
          manager.getRepository(CuentaCorrientePagoAplicacion).create({
            pagoId: pago.id,
            cuentaCorrienteVentaId: venta.id,
            montoAplicado,
          }),
        );

        restante = this.to2(restante - montoAplicado);
      }

      if (ventasActualizadas.length > 0) {
        await manager
          .getRepository(CuentaCorrienteVenta)
          .save(ventasActualizadas);
      }
      if (aplicaciones.length > 0) {
        await manager
          .getRepository(CuentaCorrientePagoAplicacion)
          .save(aplicaciones);
      }

      const saldoAnterior = Number(cuenta.saldoActual ?? 0);
      cuenta.saldoActual = this.to2(saldoAnterior - montoPago);
      await cuentaRepo.save(cuenta);

      const descripcion =
        restante > 0
          ? `Pago cuenta corriente. Saldo a favor generado: ${restante.toFixed(2)}`
          : 'Pago cuenta corriente';

      const movimiento = await manager
        .getRepository(CuentaCorrienteMovimiento)
        .save({
          cuentaCorrienteId: cuenta.id,
          tipo: CuentaCorrienteMovimientoTipo.PAGO,
          pagoId: pago.id,
          ventaId: null,
          monto: montoPago,
          saldoResultante: cuenta.saldoActual,
          descripcion,
          usuarioId: usuarioId ?? null,
        });

      const movimientoCaja = await manager.getRepository(MovimientoCaja).save({
        caja_id: caja.id,
        tipo: 'INGRESO',
        medio_pago: dto.medioPago,
        origen: MovimientoCajaOrigen.CUENTA_CORRIENTE,
        cuenta_corriente_pago_id: pago.id,
        monto: montoPago,
        motivo: `Cobro cuenta corriente #${cuenta.id} - ${cuenta.nombre}`,
        observacion:
          this.clean(dto.observacion) ??
          this.clean(dto.referencia) ??
          `Pago cuenta corriente #${pago.id}`,
        usuario_id: usuarioId,
        anulado: false,
      });

      return {
        pago,
        aplicaciones,
        movimiento,
        movimientoCaja,
        saldoActual: cuenta.saldoActual,
        saldoAFavorGenerado: restante > 0 ? restante : 0,
      };
    });
  }

  async registrarVentaCuentaCorrienteTx(params: {
    manager: EntityManager;
    cuentaCorrienteId: number;
    venta: Venta;
    almacenId: number;
    total: number;
    pagos: Array<{ medio: MetodoPago; monto: number }>;
    usuarioId?: number;
  }) {
    const {
      manager,
      cuentaCorrienteId,
      venta,
      almacenId,
      total,
      pagos,
      usuarioId,
    } = params;

    const totalVenta = this.to2(Number(total));
    const totalPagado = this.to2(
      pagos.reduce((acc, pago) => acc + Number(pago.monto), 0),
    );

    if (totalPagado > 0) {
      const caja = await manager.getRepository(SesionCaja).findOne({
        where: { almacen_id: almacenId, estado: 'ABIERTA' },
      });

      if (!caja) {
        throw new BadRequestException(
          `No hay caja abierta para el almacen ${almacenId}`,
        );
      }
    }

    const cuentaRepo = manager.getRepository(CuentaCorriente);
    const cuenta = await cuentaRepo
      .createQueryBuilder('cuenta')
      .where('cuenta.id = :cuentaCorrienteId', { cuentaCorrienteId })
      .setLock('pessimistic_write')
      .getOne();

    if (!cuenta) {
      throw new NotFoundException(
        `Cuenta corriente ${cuentaCorrienteId} no encontrada`,
      );
    }

    if (!cuenta.activa) {
      throw new BadRequestException(
        `La cuenta corriente ${cuentaCorrienteId} esta inactiva`,
      );
    }

    const montoAplicadoAVenta = this.to2(Math.min(totalPagado, totalVenta));
    const montoPendiente = this.to2(Math.max(totalVenta - totalPagado, 0));

    const cuentaVenta = await manager.getRepository(CuentaCorrienteVenta).save({
      cuentaCorrienteId: cuenta.id,
      ventaId: venta.id,
      montoOriginal: totalVenta,
      montoPagado: montoAplicadoAVenta,
      montoPendiente,
      estado:
        montoPendiente <= 0
          ? CuentaCorrienteVentaEstado.PAGADA
          : montoAplicadoAVenta > 0
            ? CuentaCorrienteVentaEstado.PARCIAL
            : CuentaCorrienteVentaEstado.PENDIENTE,
    });

    let saldoResultante = this.to2(Number(cuenta.saldoActual ?? 0) + totalVenta);
    await manager.getRepository(CuentaCorrienteMovimiento).save({
      cuentaCorrienteId: cuenta.id,
      tipo: CuentaCorrienteMovimientoTipo.DEUDA,
      ventaId: venta.id,
      pagoId: null,
      monto: totalVenta,
      saldoResultante,
      descripcion: `Deuda generada por venta #${venta.id}`,
      usuarioId: usuarioId ?? null,
    });

    let restanteAplicable = montoAplicadoAVenta;
    const pagosGuardados: CuentaCorrientePago[] = [];
    const aplicaciones: CuentaCorrientePagoAplicacion[] = [];

    for (const pago of pagos) {
      const montoPago = this.to2(Number(pago.monto));
      if (montoPago <= 0) continue;

      const pagoGuardado = await manager.getRepository(CuentaCorrientePago).save({
        cuentaCorrienteId: cuenta.id,
        almacenId,
        monto: montoPago,
        medioPago: pago.medio,
        referencia: `Venta #${venta.id}`,
        observacion: 'Pago inicial de venta a cuenta corriente',
        usuarioId: usuarioId ?? null,
      });
      pagosGuardados.push(pagoGuardado);

      const montoAplicado = this.to2(Math.min(restanteAplicable, montoPago));
      if (montoAplicado > 0) {
        aplicaciones.push(
          await manager.getRepository(CuentaCorrientePagoAplicacion).save({
            pagoId: pagoGuardado.id,
            cuentaCorrienteVentaId: cuentaVenta.id,
            montoAplicado,
          }),
        );
        restanteAplicable = this.to2(restanteAplicable - montoAplicado);
      }

      saldoResultante = this.to2(saldoResultante - montoPago);
      await manager.getRepository(CuentaCorrienteMovimiento).save({
        cuentaCorrienteId: cuenta.id,
        tipo: CuentaCorrienteMovimientoTipo.PAGO,
        ventaId: venta.id,
        pagoId: pagoGuardado.id,
        monto: montoPago,
        saldoResultante,
        descripcion: `Pago inicial de venta #${venta.id}`,
        usuarioId: usuarioId ?? null,
      });
    }

    cuenta.saldoActual = saldoResultante;
    await cuentaRepo.save(cuenta);

    return {
      cuenta,
      cuentaVenta,
      pagos: pagosGuardados,
      aplicaciones,
      saldoActual: cuenta.saldoActual,
      saldoAFavorGenerado:
        totalPagado > totalVenta ? this.to2(totalPagado - totalVenta) : 0,
    };
  }

  async registrarAjuste(
    cuentaId: number,
    dto: CreateCuentaCorrienteAjusteDto,
    usuarioId?: number,
  ) {
    const monto = this.to2(Number(dto.monto));
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new BadRequestException('El monto del ajuste debe ser mayor a 0');
    }

    const descripcion = this.clean(dto.descripcion);
    if (!descripcion) {
      throw new BadRequestException('La descripcion del ajuste es obligatoria');
    }

    return this.dataSource.transaction(async (manager) => {
      const cuentaRepo = manager.getRepository(CuentaCorriente);
      const cuenta = await cuentaRepo
        .createQueryBuilder('cuenta')
        .where('cuenta.id = :cuentaId', { cuentaId })
        .setLock('pessimistic_write')
        .getOne();

      if (!cuenta) {
        throw new NotFoundException(
          `Cuenta corriente ${cuentaId} no encontrada`,
        );
      }

      const saldoAnterior = Number(cuenta.saldoActual ?? 0);
      const delta =
        dto.tipo === CuentaCorrienteMovimientoTipo.AJUSTE_DEBITO
          ? monto
          : -monto;
      cuenta.saldoActual = this.to2(saldoAnterior + delta);
      await cuentaRepo.save(cuenta);

      const movimiento = await manager
        .getRepository(CuentaCorrienteMovimiento)
        .save({
          cuentaCorrienteId: cuenta.id,
          tipo: dto.tipo,
          ventaId: null,
          pagoId: null,
          monto,
          saldoResultante: cuenta.saldoActual,
          descripcion,
          usuarioId: usuarioId ?? null,
        });

      return {
        cuenta,
        movimiento,
        saldoAnterior: this.to2(saldoAnterior),
        saldoActual: cuenta.saldoActual,
      };
    });
  }

  private async assertDocumentoDisponible(
    documento: string | null | undefined,
    excludeId?: number,
  ): Promise<void> {
    if (!documento) return;

    const existente = await this.cuentaRepo.findOne({
      where: {
        documento,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe una cuenta corriente con documento "${documento}"`,
      );
    }
  }

  private clean(value: string | undefined | null): string | null | undefined {
    if (value === undefined) return undefined;
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }

  private to2(value: number): number {
    return Number(value.toFixed(2));
  }
}
