import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionCaja } from './sesion-caja.entity';
import {
  MovimientoCaja,
  MovimientoCajaOrigen,
} from './movimiento-caja.entity';
import { IngresoVenta } from 'src/ingreso/ingreso-venta.entity';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { AgregarMovimientoDto } from './dto/agregar-movimiento.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { AnularMovimientoDto } from './dto/anular-movimiento.dto';
import {
  FiltroMovimientoCajaDto,
  MovimientoCajaTipo,
  OrdenMovimientoCaja,
} from './dto/filtro-movimiento-caja.dto';
import {
  MetodoPagoPersistido,
  METODOS_PAGO_BANCARIZADOS,
  normalizarFiltroMetodoPago,
} from 'src/common/metodo-pago.enum';

type TotalesPorMetodo = {
  efectivo: number;
  transferencia: number;
  debito: number;
  credito: number;
  bancarizadoLegacy: number;
  bancarizado: number;
  total: number;
};

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(SesionCaja)
    private readonly sesionRepo: Repository<SesionCaja>,
    @InjectRepository(MovimientoCaja)
    private readonly movimientoRepo: Repository<MovimientoCaja>,
    @InjectRepository(IngresoVenta)
    private readonly ingresoRepo: Repository<IngresoVenta>,
  ) {}

  // US1 — Apertura de caja
  async abrir(dto: AbrirCajaDto, usuarioId: number): Promise<SesionCaja> {
    const cajaAbierta = await this.sesionRepo.findOne({
      where: { almacen_id: dto.almacen_id, estado: 'ABIERTA' },
    });

    if (cajaAbierta) {
      throw new BadRequestException(
        `Ya existe una caja abierta para el almacén ${dto.almacen_id} (sesión #${cajaAbierta.id})`,
      );
    }

    const sesion = this.sesionRepo.create({
      almacen_id: dto.almacen_id,
      usuario_id: usuarioId,
      monto_inicial: dto.monto_inicial,
      observacion: dto.observacion ?? null,
      estado: 'ABIERTA',
    });

    return this.sesionRepo.save(sesion);
  }

  // US2/US3 — Agregar movimiento manual (INGRESO, EGRESO, RETIRO)
  async agregarMovimiento(
    cajaId: number,
    dto: AgregarMovimientoDto,
    usuarioId: number,
  ): Promise<MovimientoCaja> {
    const sesion = await this.getSesionOFail(cajaId);
    this.assertAbierta(sesion);

    const movimiento = this.movimientoRepo.create({
      caja_id: cajaId,
      tipo: dto.tipo,
      monto: dto.monto,
      medio_pago: dto.medio_pago ?? 'EFECTIVO',
      origen: MovimientoCajaOrigen.MANUAL,
      cuenta_corriente_pago_id: null,
      motivo: dto.motivo,
      observacion: dto.observacion ?? null,
      usuario_id: usuarioId,
      anulado: false,
    });

    return this.movimientoRepo.save(movimiento);
  }

  // US4 — Cierre de caja
  async cerrar(
    cajaId: number,
    dto: CerrarCajaDto,
    usuarioId: number,
  ): Promise<object> {
    const sesion = await this.getSesionOFail(cajaId);
    this.assertAbierta(sesion);

    const resumen = await this.calcularResumen(sesion);
    const efectivo_esperado = resumen.efectivo_esperado;
    const diferencia =
      Number(dto.efectivo_contado) - Number(efectivo_esperado);

    sesion.estado = 'CERRADA';
    sesion.fecha_cierre = new Date();
    sesion.efectivo_contado = dto.efectivo_contado;
    sesion.diferencia = parseFloat(diferencia.toFixed(2));

    await this.sesionRepo.save(sesion);

    return {
      id: sesion.id,
      estado: 'CERRADA',
      almacen_id: sesion.almacen_id,
      usuario_id: sesion.usuario_id,
      fecha_apertura: sesion.fecha_apertura,
      fecha_cierre: sesion.fecha_cierre,
      reporte: {
        monto_inicial: Number(sesion.monto_inicial).toFixed(2),
        cobros_efectivo: resumen.cobros_efectivo.toFixed(2),
        cobros_bancarizado: resumen.cobros_bancarizado.toFixed(2),
        cobros_por_metodo: resumen.cobros_por_metodo,
        cobros_ventas: this.formatearTotalesPorMetodo(resumen.cobros_ventas),
        cobros_cuenta_corriente: this.formatearTotalesPorMetodo(
          resumen.cobros_cuenta_corriente,
        ),
        movimientos_manuales: {
          ingresos: this.formatearTotalesPorMetodo(
            resumen.ingresos_manuales_por_metodo,
          ),
          egresos: this.formatearTotalesPorMetodo(
            resumen.egresos_manuales_por_metodo,
          ),
          retiros: this.formatearTotalesPorMetodo(resumen.retiros_por_metodo),
        },
        ingresos_manuales: resumen.ingresos_manuales.toFixed(2),
        ingresos_manuales_bancarizado:
          resumen.ingresos_manuales_bancarizado.toFixed(2),
        egresos_manuales: resumen.egresos_manuales.toFixed(2),
        retiros: resumen.retiros.toFixed(2),
        efectivo_esperado: efectivo_esperado.toFixed(2),
        efectivo_contado: Number(dto.efectivo_contado).toFixed(2),
        diferencia: sesion.diferencia.toFixed(2),
      },
    };
  }

  // US4/US6 — Reporte de sesión (abierta o cerrada)
  async getReporte(cajaId: number): Promise<object> {
    const sesion = await this.getSesionOFail(cajaId);
    const resumen = await this.calcularResumen(sesion);

    const base = {
      id: sesion.id,
      estado: sesion.estado,
      almacen_id: sesion.almacen_id,
      usuario_id: sesion.usuario_id,
      fecha_apertura: sesion.fecha_apertura,
      fecha_cierre: sesion.fecha_cierre ?? null,
      reporte: {
        monto_inicial: Number(sesion.monto_inicial).toFixed(2),
        cobros_efectivo: resumen.cobros_efectivo.toFixed(2),
        cobros_bancarizado: resumen.cobros_bancarizado.toFixed(2),
        cobros_por_metodo: resumen.cobros_por_metodo,
        cobros_ventas: this.formatearTotalesPorMetodo(resumen.cobros_ventas),
        cobros_cuenta_corriente: this.formatearTotalesPorMetodo(
          resumen.cobros_cuenta_corriente,
        ),
        movimientos_manuales: {
          ingresos: this.formatearTotalesPorMetodo(
            resumen.ingresos_manuales_por_metodo,
          ),
          egresos: this.formatearTotalesPorMetodo(
            resumen.egresos_manuales_por_metodo,
          ),
          retiros: this.formatearTotalesPorMetodo(resumen.retiros_por_metodo),
        },
        ingresos_manuales: resumen.ingresos_manuales.toFixed(2),
        ingresos_manuales_bancarizado:
          resumen.ingresos_manuales_bancarizado.toFixed(2),
        egresos_manuales: resumen.egresos_manuales.toFixed(2),
        retiros: resumen.retiros.toFixed(2),
        efectivo_esperado: resumen.efectivo_esperado.toFixed(2),
        efectivo_contado: sesion.efectivo_contado
          ? Number(sesion.efectivo_contado).toFixed(2)
          : null,
        diferencia: sesion.diferencia
          ? Number(sesion.diferencia).toFixed(2)
          : null,
      },
    };

    return base;
  }

  // US6 — Obtener caja activa por almacén
  async obtenerActiva(almacenId: number): Promise<object> {
    const sesion = await this.sesionRepo.findOne({
      where: { almacen_id: almacenId, estado: 'ABIERTA' },
    });

    if (!sesion) {
      throw new NotFoundException(
        `No hay caja abierta para el almacén ${almacenId}`,
      );
    }

    const resumen = await this.calcularResumen(sesion);

    return {
      id: sesion.id,
      almacen_id: sesion.almacen_id,
      usuario_id: sesion.usuario_id,
      monto_inicial: Number(sesion.monto_inicial).toFixed(2),
      estado: sesion.estado,
      observacion: sesion.observacion,
      fecha_apertura: sesion.fecha_apertura,
      resumen_parcial: {
        cobros_efectivo: resumen.cobros_efectivo.toFixed(2),
        cobros_bancarizado: resumen.cobros_bancarizado.toFixed(2),
        cobros_por_metodo: resumen.cobros_por_metodo,
        cobros_ventas: this.formatearTotalesPorMetodo(resumen.cobros_ventas),
        cobros_cuenta_corriente: this.formatearTotalesPorMetodo(
          resumen.cobros_cuenta_corriente,
        ),
        movimientos_manuales: {
          ingresos: this.formatearTotalesPorMetodo(
            resumen.ingresos_manuales_por_metodo,
          ),
          egresos: this.formatearTotalesPorMetodo(
            resumen.egresos_manuales_por_metodo,
          ),
          retiros: this.formatearTotalesPorMetodo(resumen.retiros_por_metodo),
        },
        ingresos_manuales: resumen.ingresos_manuales.toFixed(2),
        ingresos_manuales_bancarizado:
          resumen.ingresos_manuales_bancarizado.toFixed(2),
        egresos_manuales: resumen.egresos_manuales.toFixed(2),
        retiros: resumen.retiros.toFixed(2),
        efectivo_esperado: resumen.efectivo_esperado.toFixed(2),
      },
    };
  }

  // US5 — Anular movimiento
  async listarMovimientos(cajaId: number, filtro: FiltroMovimientoCajaDto) {
    await this.getSesionOFail(cajaId);

    const page = this.normalizarEntero(filtro.page, 1, 1);
    const limit = Math.min(this.normalizarEntero(filtro.limit, 50, 1), 200);
    const order = this.normalizarOrden(filtro.order);
    const origen = this.normalizarOrigen(filtro.origen);
    const tipo = this.normalizarTipo(filtro.tipo);
    const medioPago = this.normalizarMedioPago(filtro.medio_pago);

    const query = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect(
        'movimiento.cuentaCorrientePago',
        'cuentaCorrientePago',
      )
      .leftJoinAndSelect(
        'cuentaCorrientePago.cuentaCorriente',
        'cuentaCorriente',
      )
      .where('movimiento.caja_id = :cajaId', { cajaId });

    if (origen) {
      query.andWhere('movimiento.origen = :origen', { origen });
    }
    if (tipo) {
      query.andWhere('movimiento.tipo = :tipo', { tipo });
    }
    if (medioPago) {
      query.andWhere('movimiento.medio_pago = :medioPago', { medioPago });
    }

    const [data, total] = await query
      .orderBy('movimiento.fecha', order)
      .addOrderBy('movimiento.id', order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async anularMovimiento(
    movimientoId: number,
    dto: AnularMovimientoDto,
    usuarioId: number,
  ): Promise<MovimientoCaja> {
    const movimiento = await this.movimientoRepo.findOne({
      where: { id: movimientoId },
    });

    if (!movimiento) {
      throw new NotFoundException(`Movimiento #${movimientoId} no encontrado`);
    }

    if (movimiento.anulado) {
      throw new BadRequestException(
        `El movimiento #${movimientoId} ya está anulado`,
      );
    }

    if (movimiento.origen === MovimientoCajaOrigen.CUENTA_CORRIENTE) {
      throw new BadRequestException(
        'Este movimiento proviene de un pago de cuenta corriente. Debe anularse desde cuenta corriente.',
      );
    }

    movimiento.anulado = true;
    movimiento.motivo_anulacion = dto.motivo_anulacion;
    movimiento.anulado_por_id = usuarioId;
    movimiento.fecha_anulacion = new Date();

    return this.movimientoRepo.save(movimiento);
  }

  // Polish — Listar sesiones con filtros y paginación
  async listarSesiones(filtro: {
    almacen_id?: number;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SesionCaja[]; total: number; page: number; limit: number }> {
    const { almacen_id, desde, hasta, page = 1, limit = 20 } = filtro;

    const query = this.sesionRepo
      .createQueryBuilder('s')
      .orderBy('s.fecha_apertura', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (almacen_id) {
      query.andWhere('s.almacen_id = :almacen_id', { almacen_id });
    }
    if (desde) {
      query.andWhere('s.fecha_apertura >= :desde', { desde: new Date(desde) });
    }
    if (hasta) {
      query.andWhere('s.fecha_apertura <= :hasta', { hasta: new Date(hasta) });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  // Helper privado — calcula resumen financiero de la sesión
  private async calcularResumen(sesion: SesionCaja): Promise<{
    cobros_efectivo: number;
    cobros_bancarizado: number;
    cobros_por_metodo: Record<string, string>;
    cobros_ventas: TotalesPorMetodo;
    cobros_cuenta_corriente: TotalesPorMetodo;
    ingresos_manuales_por_metodo: TotalesPorMetodo;
    egresos_manuales_por_metodo: TotalesPorMetodo;
    retiros_por_metodo: TotalesPorMetodo;
    ingresos_manuales: number;
    ingresos_manuales_bancarizado: number;
    egresos_manuales: number;
    retiros: number;
    efectivo_esperado: number;
  }> {
    const hasta = sesion.fecha_cierre ?? new Date();

    // Cobros de ventas del período (IngresoVenta JOIN Venta por almacen_id)
    const cobros = await this.ingresoRepo
      .createQueryBuilder('iv')
      .select('iv.tipo', 'tipo')
      .addSelect('SUM(iv.monto)', 'total')
      .innerJoin('iv.venta', 'v')
      .where('v.almacen_id = :almacen_id', { almacen_id: sesion.almacen_id })
      .andWhere('iv.fecha >= :desde', { desde: sesion.fecha_apertura })
      .andWhere('iv.fecha <= :hasta', { hasta })
      .groupBy('iv.tipo')
      .getRawMany();

    const cobrosMap: Record<string, number> = {};
    cobros.forEach(c => {
      cobrosMap[c.tipo] = parseFloat(c.total || 0);
    });

    // Movimientos manuales de la sesión (no anulados)
    const movimientos = await this.movimientoRepo
      .createQueryBuilder('m')
      .select('m.tipo', 'tipo')
      .addSelect('m.medio_pago', 'medio_pago')
      .addSelect(`COALESCE(m.origen, 'MANUAL')`, 'origen')
      .addSelect('SUM(m.monto)', 'total')
      .where('m.caja_id = :cajaId', { cajaId: sesion.id })
      .andWhere('m.anulado = false')
      .groupBy('m.tipo')
      .addGroupBy('m.medio_pago')
      .addGroupBy(`COALESCE(m.origen, 'MANUAL')`)
      .getRawMany();

    const movMap: Record<string, number> = {};
    movimientos.forEach(m => {
      const medioPago = m.medio_pago ?? 'EFECTIVO';
      const origen = m.origen ?? MovimientoCajaOrigen.MANUAL;
      movMap[`${origen}:${m.tipo}:${medioPago}`] = parseFloat(m.total || 0);
    });

    const cobros_ventas = this.totalesDesdeMapa(cobrosMap);
    const cobros_cuenta_corriente = this.totalesDesdeMovimientos(
      movMap,
      MovimientoCajaOrigen.CUENTA_CORRIENTE,
      'INGRESO',
    );
    const ingresos_manuales_por_metodo = this.totalesDesdeMovimientos(
      movMap,
      MovimientoCajaOrigen.MANUAL,
      'INGRESO',
    );
    const egresos_manuales_por_metodo = this.totalesDesdeMovimientos(
      movMap,
      MovimientoCajaOrigen.MANUAL,
      'EGRESO',
    );
    const retiros_por_metodo = this.totalesDesdeMovimientos(
      movMap,
      MovimientoCajaOrigen.MANUAL,
      'RETIRO',
    );

    const cobros_efectivo = cobros_ventas.efectivo;
    const cobros_bancarizado = cobros_ventas.bancarizado;
    const cobros_por_metodo = {
      EFECTIVO: cobros_efectivo.toFixed(2),
      TRANSFERENCIA: cobros_ventas.transferencia.toFixed(2),
      DEBITO: cobros_ventas.debito.toFixed(2),
      CREDITO: cobros_ventas.credito.toFixed(2),
      BANCARIZADO_LEGACY: cobros_ventas.bancarizadoLegacy.toFixed(2),
    };
    const ingresos_manuales = ingresos_manuales_por_metodo.efectivo;
    const ingresos_manuales_bancarizado =
      ingresos_manuales_por_metodo.bancarizado;
    const egresos_manuales = egresos_manuales_por_metodo.total;
    const retiros = retiros_por_metodo.total;

    const efectivo_esperado =
      Number(sesion.monto_inicial) +
      cobros_efectivo +
      cobros_cuenta_corriente.efectivo +
      ingresos_manuales -
      egresos_manuales_por_metodo.efectivo -
      retiros_por_metodo.efectivo;

    return {
      cobros_efectivo,
      cobros_bancarizado,
      cobros_por_metodo,
      cobros_ventas,
      cobros_cuenta_corriente,
      ingresos_manuales_por_metodo,
      egresos_manuales_por_metodo,
      retiros_por_metodo,
      ingresos_manuales,
      ingresos_manuales_bancarizado,
      egresos_manuales,
      retiros,
      efectivo_esperado: parseFloat(efectivo_esperado.toFixed(2)),
    };
  }

  private totalesDesdeMovimientos(
    movMap: Record<string, number>,
    origen: MovimientoCajaOrigen,
    tipo: 'INGRESO' | 'EGRESO' | 'RETIRO',
  ): TotalesPorMetodo {
    return this.totalesDesdeMapa({
      EFECTIVO: movMap[`${origen}:${tipo}:EFECTIVO`] ?? 0,
      TRANSFERENCIA: movMap[`${origen}:${tipo}:TRANSFERENCIA`] ?? 0,
      DEBITO: movMap[`${origen}:${tipo}:DEBITO`] ?? 0,
      CREDITO: movMap[`${origen}:${tipo}:CREDITO`] ?? 0,
      BANCARIZADO: movMap[`${origen}:${tipo}:BANCARIZADO`] ?? 0,
    });
  }

  private totalesDesdeMapa(map: Record<string, number>): TotalesPorMetodo {
    const efectivo = map['EFECTIVO'] ?? 0;
    const transferencia = map['TRANSFERENCIA'] ?? 0;
    const debito = map['DEBITO'] ?? 0;
    const credito = map['CREDITO'] ?? 0;
    const bancarizadoLegacy = map['BANCARIZADO'] ?? 0;
    const bancarizado =
      bancarizadoLegacy +
      METODOS_PAGO_BANCARIZADOS.reduce(
        (acc, metodo) => acc + (map[metodo] ?? 0),
        0,
      );

    return {
      efectivo,
      transferencia,
      debito,
      credito,
      bancarizadoLegacy,
      bancarizado,
      total: efectivo + bancarizado,
    };
  }

  private formatearTotalesPorMetodo(totales: TotalesPorMetodo) {
    return {
      efectivo: totales.efectivo.toFixed(2),
      transferencia: totales.transferencia.toFixed(2),
      debito: totales.debito.toFixed(2),
      credito: totales.credito.toFixed(2),
      bancarizadoLegacy: totales.bancarizadoLegacy.toFixed(2),
      bancarizado: totales.bancarizado.toFixed(2),
      total: totales.total.toFixed(2),
    };
  }

  private normalizarEntero(
    value: number | string | undefined,
    defaultValue: number,
    min: number,
  ): number {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min) {
      throw new BadRequestException(`Parametro numerico invalido: ${value}`);
    }

    return parsed;
  }

  private normalizarOrden(value?: unknown): OrdenMovimientoCaja {
    if (value === undefined || value === null || value === '') return 'DESC';
    const normalized = String(value).trim().toUpperCase();
    if (normalized !== 'ASC' && normalized !== 'DESC') {
      throw new BadRequestException('order debe ser ASC o DESC');
    }

    return normalized;
  }

  private normalizarOrigen(value?: unknown): MovimientoCajaOrigen | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).trim().toUpperCase();
    if (
      normalized !== MovimientoCajaOrigen.MANUAL &&
      normalized !== MovimientoCajaOrigen.CUENTA_CORRIENTE
    ) {
      throw new BadRequestException(
        'origen debe ser MANUAL o CUENTA_CORRIENTE',
      );
    }

    return normalized as MovimientoCajaOrigen;
  }

  private normalizarTipo(value?: unknown): MovimientoCajaTipo | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).trim().toUpperCase();
    if (!['INGRESO', 'EGRESO', 'RETIRO'].includes(normalized)) {
      throw new BadRequestException('tipo debe ser INGRESO, EGRESO o RETIRO');
    }

    return normalized as MovimientoCajaTipo;
  }

  private normalizarMedioPago(
    value?: unknown,
  ): MetodoPagoPersistido | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = normalizarFiltroMetodoPago(value);
    if (!normalized) {
      throw new BadRequestException(
        'medio_pago debe ser EFECTIVO, TRANSFERENCIA, DEBITO, CREDITO o BANCARIZADO',
      );
    }

    return normalized;
  }

  private async getSesionOFail(cajaId: number): Promise<SesionCaja> {
    const sesion = await this.sesionRepo.findOne({ where: { id: cajaId } });
    if (!sesion) {
      throw new NotFoundException(`Sesión de caja #${cajaId} no encontrada`);
    }
    return sesion;
  }

  private assertAbierta(sesion: SesionCaja): void {
    if (sesion.estado !== 'ABIERTA') {
      throw new BadRequestException(
        `La sesión de caja #${sesion.id} está cerrada. No se pueden registrar movimientos.`,
      );
    }
  }
}
