import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionCaja } from './sesion-caja.entity';
import { MovimientoCaja } from './movimiento-caja.entity';
import { IngresoVenta } from 'src/ingreso/ingreso-venta.entity';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { AgregarMovimientoDto } from './dto/agregar-movimiento.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { AnularMovimientoDto } from './dto/anular-movimiento.dto';
import {
  METODOS_PAGO_BANCARIZADOS,
  esMetodoPagoBancarizado,
} from 'src/common/metodo-pago.enum';

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
      .addSelect('SUM(m.monto)', 'total')
      .where('m.caja_id = :cajaId', { cajaId: sesion.id })
      .andWhere('m.anulado = false')
      .groupBy('m.tipo')
      .addGroupBy('m.medio_pago')
      .getRawMany();

    const movMap: Record<string, number> = {};
    movimientos.forEach(m => {
      const medioPago = m.medio_pago ?? 'EFECTIVO';
      movMap[`${m.tipo}:${medioPago}`] = parseFloat(m.total || 0);
    });

    const cobros_efectivo = cobrosMap['EFECTIVO'] ?? 0;
    const cobros_bancarizado =
      (cobrosMap['BANCARIZADO'] ?? 0) +
      METODOS_PAGO_BANCARIZADOS.reduce(
        (acc, metodo) => acc + (cobrosMap[metodo] ?? 0),
        0,
      );
    const cobros_por_metodo = {
      EFECTIVO: cobros_efectivo.toFixed(2),
      TRANSFERENCIA: (cobrosMap['TRANSFERENCIA'] ?? 0).toFixed(2),
      DEBITO: (cobrosMap['DEBITO'] ?? 0).toFixed(2),
      CREDITO: (cobrosMap['CREDITO'] ?? 0).toFixed(2),
      BANCARIZADO_LEGACY: (cobrosMap['BANCARIZADO'] ?? 0).toFixed(2),
    };
    const ingresos_manuales = movMap['INGRESO:EFECTIVO'] ?? 0;
    const ingresos_manuales_bancarizado = Object.entries(movMap)
      .filter(([key]) => {
        const [tipo, medioPago] = key.split(':');
        return tipo === 'INGRESO' && esMetodoPagoBancarizado(medioPago);
      })
      .reduce((acc, [, total]) => acc + total, 0);
    const egresos_manuales =
      (movMap['EGRESO:EFECTIVO'] ?? 0) +
      Object.entries(movMap)
        .filter(([key]) => {
          const [tipo, medioPago] = key.split(':');
          return tipo === 'EGRESO' && esMetodoPagoBancarizado(medioPago);
        })
        .reduce((acc, [, total]) => acc + total, 0);
    const retiros =
      (movMap['RETIRO:EFECTIVO'] ?? 0) +
      Object.entries(movMap)
        .filter(([key]) => {
          const [tipo, medioPago] = key.split(':');
          return tipo === 'RETIRO' && esMetodoPagoBancarizado(medioPago);
        })
        .reduce((acc, [, total]) => acc + total, 0);

    const efectivo_esperado =
      Number(sesion.monto_inicial) +
      cobros_efectivo +
      ingresos_manuales -
      egresos_manuales -
      retiros;

    return {
      cobros_efectivo,
      cobros_bancarizado,
      cobros_por_metodo,
      ingresos_manuales,
      ingresos_manuales_bancarizado,
      egresos_manuales,
      retiros,
      efectivo_esperado: parseFloat(efectivo_esperado.toFixed(2)),
    };
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
