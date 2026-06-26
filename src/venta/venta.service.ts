import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Venta } from './venta.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import {
  MedioPagoVenta,
  normalizarMedioPago,
} from './dto/create-venta-pago.dto';
import { VentaItem } from './venta-item.entity';
import { ProductoService } from '../producto/producto.service';

import { Usuario } from '../usuario/usuario.entity';
import { PromocionService } from 'src/promocion/promocion.service';
import { IngresoVenta } from '../ingreso/ingreso-venta.entity'; // Import the entity (adjust path if needed)
import { EstadisticasVentasDto } from './dto/estadisticas-ventas.dto';
import { Almacen } from 'src/almacen/almacen.entity';
import { UpdateEstadoVentaDto } from './dto/update-estado-venta.dto';
import { Producto } from 'src/producto/producto.entity';
import { StockActual } from 'src/stock-actual/stock-actual.entity';
import { MovimientoStock } from 'src/movimiento-stock/movimiento-stock.entity';
import moment from 'moment-timezone';

@Injectable()
export class VentaService {
  constructor(
    @InjectRepository(Venta)
    private readonly repo: Repository<Venta>,
    private readonly productoService: ProductoService,
    private readonly promoService: PromocionService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateVentaDto & { usuario: Usuario }) {
    const savedId = await this.dataSource.transaction(async (manager) => {
      const almacen = await manager
        .getRepository(Almacen)
        .findOneBy({ id: dto.almacenId });
      if (!almacen) {
        throw new NotFoundException(`Almacen ${dto.almacenId} no encontrado`);
      }

      const { items, total } = await this.armarItemsVenta(dto, manager);
      if (items.length === 0) {
        throw new BadRequestException(
          'La venta debe incluir al menos un item o una promocion',
        );
      }

      const pagos = this.normalizarPagos(dto.pagos);
      this.validarTotalPagos(pagos, total);

      const ventaRepo = manager.getRepository(Venta);
      const venta = ventaRepo.create({
        usuario: dto.usuario,
        almacen,
        items,
        total,
        estado: 'CONFIRMADA',
        fecha: moment().tz('America/Argentina/Buenos_Aires').toDate(),
      });
      const saved = await ventaRepo.save(venta);

      await manager.getRepository(IngresoVenta).save(
        pagos.map((pago) => ({
          venta: saved,
          tipo: pago.medio,
          monto: pago.monto,
        })),
      );

      for (const item of items) {
        if (!item.producto) continue;
        await this.descontarStockYRegistrarMovimientoTx(
          manager,
          item,
          dto.almacenId,
          saved.id,
        );
      }

      return saved.id;
    });

    return this.getVentaCompleta(savedId);
  }

  findAll(): Promise<Venta[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.repo.findOne({ where: { id } });
    if (!venta) {
      throw new NotFoundException(`Venta with ID ${id} not found`);
    }
    return venta;
  }

  async obtenerTodasConFiltros(filtros: {
    fechaDesde?: string;
    fechaHasta?: string;
    horaDesde?: string;
    horaHasta?: string;
    usuarioId?: string;
    estado?: string;
    almacenId?: string;
    tipo?: 'EFECTIVO' | 'BANCARIZADO';
    page?: number;
    limit?: number;
    ordenCampo?: string;
    ordenDireccion?: 'ASC' | 'DESC';
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalesFiltrados: {
      totalAcumulado: number;
      efectivo: number;
      bancarizado: number;
    };
  }> {
    const {
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      usuarioId,
      almacenId,
      estado,
      tipo,
      page = 1,
      limit = 50,
      ordenCampo = 'fecha',
      ordenDireccion = 'DESC',
    } = filtros;

    console.log('FILTROS VENTAS >>>', {
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      usuarioId,
      almacenId,
      estado,
      tipo,
    });

    const query = this.repo
      .createQueryBuilder('venta')
      .leftJoin('venta.usuario', 'usuario')
      .leftJoin('venta.items', 'items')
      .leftJoin('items.producto', 'producto')
      .leftJoin('producto.unidad', 'unidad')
      .leftJoin('producto.categoria', 'categoria')
      .leftJoin('venta.almacen', 'almacen')
      .leftJoin('venta.ingresos', 'ingreso')
      .select([
        'venta.id',
        'venta.fecha',
        'venta.total',
        'venta.estado',

        'usuario.id',
        'usuario.nombre',

        'items.id',
        'items.cantidad',
        'items.cantidad_gramos',
        'items.precioUnitario',
        'items.subtotal',

        'producto.id',
        'producto.nombre',
        'producto.descripcion',
        'producto.barcode',
        'producto.precioBase',

        'unidad.nombre',
        'categoria.nombre',

        'almacen.id',
        'almacen.nombre',

        'ingreso.tipo',
        'ingreso.monto',
      ])
      .skip((page - 1) * limit)
      .take(limit);

    // 🔹 Filtro fecha + hora (SIN moment, SIN UTC)
    if (fechaDesde) {
      const horaIni = horaDesde ?? '00:00';
      const fechaHoraDesde = `${fechaDesde} ${horaIni}:00`;

      query.andWhere('venta.fecha >= :fechaDesde', {
        fechaDesde: fechaHoraDesde,
      });
    }

    if (fechaHasta) {
      const horaFin = horaHasta ?? '23:59';
      const fechaHoraHasta = `${fechaHasta} ${horaFin}:59`;

      query.andWhere('venta.fecha <= :fechaHasta', {
        fechaHasta: fechaHoraHasta,
      });
    }

    if (usuarioId) {
      query.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (estado) {
      const estados = estado
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      if (estados.length > 0) {
        query.andWhere('venta.estado IN (:...estados)', { estados });
      }
    }

    if (almacenId) {
      const almacenIdNum = parseInt(almacenId, 10);
      if (!isNaN(almacenIdNum)) {
        query.andWhere('almacen.id = :almacenId', { almacenId: almacenIdNum });
      }
    }

    if (tipo) {
      query.andWhere('ingreso.tipo = :tipo', { tipo });
    }

    const camposValidos = ['fecha', 'id', 'estado'];
    const campoOrdenFinal = camposValidos.includes(ordenCampo)
      ? ordenCampo
      : 'fecha';

    query.orderBy(`venta.${campoOrdenFinal}`, ordenDireccion);

    const [[ventas, total], totalesFiltrados] = await Promise.all([
      query.getManyAndCount(),
      this.obtenerTotalesFiltrados(filtros),
    ]);

    return {
      data: ventas,
      total,
      page,
      limit,
      totalesFiltrados,
    };
  }

  private aplicarFiltrosBaseVentas(
    query: SelectQueryBuilder<Venta>,
    filtros: {
      fechaDesde?: string;
      fechaHasta?: string;
      horaDesde?: string;
      horaHasta?: string;
      usuarioId?: string;
      estado?: string;
      almacenId?: string;
      tipo?: 'EFECTIVO' | 'BANCARIZADO';
    },
    tipoMode: 'joined' | 'exists' | 'none' = 'joined',
  ) {
    const {
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      usuarioId,
      almacenId,
      estado,
      tipo,
    } = filtros;

    if (fechaDesde) {
      const horaIni = horaDesde ?? '00:00';
      const fechaHoraDesde = `${fechaDesde} ${horaIni}:00`;

      query.andWhere('venta.fecha >= :fechaDesde', {
        fechaDesde: fechaHoraDesde,
      });
    }

    if (fechaHasta) {
      const horaFin = horaHasta ?? '23:59';
      const fechaHoraHasta = `${fechaHasta} ${horaFin}:59`;

      query.andWhere('venta.fecha <= :fechaHasta', {
        fechaHasta: fechaHoraHasta,
      });
    }

    if (usuarioId) {
      query.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (estado) {
      const estados = estado
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      if (estados.length > 0) {
        query.andWhere('venta.estado IN (:...estados)', { estados });
      }
    }

    if (almacenId) {
      const almacenIdNum = parseInt(almacenId, 10);
      if (!isNaN(almacenIdNum)) {
        query.andWhere('almacen.id = :almacenId', { almacenId: almacenIdNum });
      }
    }

    if (tipo && tipoMode === 'joined') {
      query.andWhere('ingreso.tipo = :tipo', { tipo });
    }

    if (tipo && tipoMode === 'exists') {
      query.andWhere(
        `EXISTS (
          SELECT 1
          FROM ingreso_venta ingreso_filtro
          WHERE ingreso_filtro.venta_id = venta.id
            AND ingreso_filtro.tipo = :tipo
        )`,
        { tipo },
      );
    }
  }

  private async obtenerTotalesFiltrados(filtros: {
    fechaDesde?: string;
    fechaHasta?: string;
    horaDesde?: string;
    horaHasta?: string;
    usuarioId?: string;
    estado?: string;
    almacenId?: string;
    tipo?: 'EFECTIVO' | 'BANCARIZADO';
  }) {
    const totalQuery = this.repo
      .createQueryBuilder('venta')
      .leftJoin('venta.usuario', 'usuario')
      .leftJoin('venta.almacen', 'almacen')
      .select('COALESCE(SUM(venta.total), 0)', 'totalAcumulado');

    this.aplicarFiltrosBaseVentas(totalQuery, filtros, 'exists');

    const ingresosQuery = this.repo
      .createQueryBuilder('venta')
      .innerJoin('venta.ingresos', 'ingreso')
      .leftJoin('venta.usuario', 'usuario')
      .leftJoin('venta.almacen', 'almacen')
      .select(
        `COALESCE(SUM(CASE WHEN ingreso.tipo = 'EFECTIVO' THEN ingreso.monto ELSE 0 END), 0)`,
        'efectivo',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN ingreso.tipo = 'BANCARIZADO' THEN ingreso.monto ELSE 0 END), 0)`,
        'bancarizado',
      );

    this.aplicarFiltrosBaseVentas(ingresosQuery, filtros, 'none');

    if (filtros.tipo) {
      ingresosQuery.andWhere('ingreso.tipo = :tipo', { tipo: filtros.tipo });
    }

    const [totalRaw, ingresosRaw] = await Promise.all([
      totalQuery.getRawOne(),
      ingresosQuery.getRawOne(),
    ]);

    return {
      totalAcumulado: this.to2(Number(totalRaw?.totalAcumulado ?? 0)),
      efectivo: this.to2(Number(ingresosRaw?.efectivo ?? 0)),
      bancarizado: this.to2(Number(ingresosRaw?.bancarizado ?? 0)),
    };
  }

  async getVentaCompleta(id: number): Promise<Venta> {
    const venta = await this.repo.findOne({
      where: { id },
      relations: [
        'usuario',
        'almacen',
        'items',
        'items.producto',
        'items.producto.unidad',
        'items.producto.categoria',
        'ingresos',
      ],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return venta;
  }

  async obtenerEstadisticasVentas(filtros: EstadisticasVentasDto) {
    const { fechaDesde, fechaHasta, almacenId } = filtros;

    const desde = fechaDesde ? `${fechaDesde} 00:00:00` : null;
    const hasta = fechaHasta ? `${fechaHasta} 23:59:59` : null;

    const almacenIdNum = almacenId ? parseInt(almacenId, 10) : NaN;
    const almacenParam = !isNaN(almacenIdNum) ? almacenIdNum : null;

    const where = `
    WHERE ($1::timestamp IS NULL OR v.fecha >= $1::timestamp)
      AND ($2::timestamp IS NULL OR v.fecha <= $2::timestamp)
      AND ($3::int IS NULL OR v.almacen_id = $3::int)
  `;

    // ✅ Resumen total (con filtro opcional de almacen)
    const resumen = await this.dataSource.query(
      `
    SELECT
      COALESCE(SUM(v.total), 0)::FLOAT AS "ingresosTotales",
      COUNT(*)::TEXT AS "totalVentas"
    FROM venta v
    ${where};
    `,
      [desde, hasta, almacenParam],
    );

    const ingresosTotales = Number(resumen[0]?.ingresosTotales ?? 0);
    const totalVentas = resumen[0]?.totalVentas ?? '0';

    // ✅ Resumen por almacén (para comparar / agrupar)
    // (si viene almacenId, te va a devolver 1 fila; si no, todas)
    const resumenPorAlmacen = await this.dataSource.query(
      `
    SELECT
      a.id::int AS "almacenId",
      a.nombre  AS "almacenNombre",
      COALESCE(SUM(v.total), 0)::FLOAT AS "ingresosTotales",
      COUNT(*)::int AS "totalVentas"
    FROM venta v
    JOIN almacen a ON a.id = v.almacen_id
    ${where}
    GROUP BY a.id, a.nombre
    ORDER BY "ingresosTotales" DESC;
    `,
      [desde, hasta, almacenParam],
    );

    // ✅ Productos agregados (con filtro opcional de almacen)
    const productos = await this.dataSource.query(
      `
    SELECT 
      p.id,
      COALESCE(
        NULLIF(TRIM(p.nombre), ''),
        NULLIF(TRIM(p.descripcion), ''),
        NULLIF(TRIM(p.sku), ''),
        'SIN NOMBRE'
      ) AS nombre,
      p.sku,
      SUM(COALESCE(vi.cantidad, 0))::INTEGER       AS "cantidadVendidaPiezas",
      SUM(COALESCE(vi.cantidad_gramos, 0))::FLOAT  AS "gramosVendidos",
      COALESCE(SUM(vi.subtotal), 0)::FLOAT         AS ingresos
    FROM venta_item vi
    JOIN producto p ON p.id = vi.producto_id
    JOIN venta v ON v.id = vi.venta_id
    ${where}
    GROUP BY p.id, p.nombre, p.descripcion, p.sku;
    `,
      [desde, hasta, almacenParam],
    );

    // ✅ Ranking normalizado: piezas vs kg (gramos/1000)
    const scoreCantidad = (p: any) => {
      const piezas = Number(p.cantidadVendidaPiezas ?? 0);
      if (piezas > 0) return piezas;
      const gramos = Number(p.gramosVendidos ?? 0);
      return gramos / 1000;
    };

    const productoMasVendido =
      productos.length > 0
        ? [...productos].sort((a, b) => scoreCantidad(b) - scoreCantidad(a))[0]
        : null;

    const productoMasIngresos =
      productos.length > 0
        ? [...productos].sort(
            (a, b) => Number(b.ingresos) - Number(a.ingresos),
          )[0]
        : null;

    const topProductosCantidad = [...productos]
      .sort((a, b) => scoreCantidad(b) - scoreCantidad(a))
      .slice(0, 5);

    const topProductosIngresos = [...productos]
      .sort((a, b) => Number(b.ingresos) - Number(a.ingresos))
      .slice(0, 5);

    // ✅ Ventas por día (con filtro opcional de almacen)
    const ventasPorDia = await this.dataSource.query(
      `
    SELECT 
      TO_CHAR(v.fecha, 'YYYY-MM-DD') AS fecha,
      COUNT(*)::INTEGER                AS cantidad,
      COALESCE(SUM(v.total), 0)::FLOAT AS ingresos
    FROM venta v
    ${where}
    GROUP BY 1
    ORDER BY 1;
    `,
      [desde, hasta, almacenParam],
    );

    const totalVentasNum = Number(totalVentas);
    const promedioVenta =
      totalVentasNum > 0 ? ingresosTotales / totalVentasNum : 0;

    return {
      ingresosTotales,
      totalVentas, // string como ya lo tenías
      promedioVenta,
      productoMasVendido,
      productoMasIngresos,
      topProductosCantidad,
      topProductosIngresos,
      ventasPorDia,

      // ✅ NUEVO (no rompe lo existente, suma funcionalidad)
      resumenPorAlmacen,
    };
  }

  // src/venta/venta.service.ts
  async actualizarEstado(
    id: number,
    dto: UpdateEstadoVentaDto,
  ): Promise<Venta> {
    const venta = await this.repo.findOneBy({ id });

    if (!venta) {
      throw new Error(`No se encontró una venta con ID ${id}`);
    }

    venta.estado = dto.estado;

    return this.repo.save(venta);
  }

  async obtenerTotalPorCategoria(
    fechaDesde?: string,
    fechaHasta?: string,
    almacenId?: string,
  ) {
    const desde = fechaDesde ? `${fechaDesde} 00:00:00` : null;
    const hasta = fechaHasta ? `${fechaHasta} 23:59:59` : null;

    const almacenIdNum = almacenId ? parseInt(almacenId, 10) : NaN;
    const almacenParam = !isNaN(almacenIdNum) ? almacenIdNum : null;

    return this.dataSource.query(
      `
    WITH por_categoria AS (
      SELECT
        c.id AS "categoriaId",
        c.nombre AS "categoriaNombre",
        COALESCE(SUM(vi.subtotal), 0)::float8 AS "totalGenerado"
      FROM venta_item vi
      JOIN producto p ON p.id = vi.producto_id
      JOIN categoria c ON c.id = p.categoria_id
      JOIN venta v ON v.id = vi.venta_id
      WHERE ($1::timestamp IS NULL OR v.fecha >= $1::timestamp)
        AND ($2::timestamp IS NULL OR v.fecha <= $2::timestamp)
        AND ($3::int IS NULL OR v.almacen_id = $3::int)
      GROUP BY c.id, c.nombre
    ),
    promos AS (
      SELECT
        0 AS "categoriaId",
        'PROMOCIONES' AS "categoriaNombre",
        COALESCE(SUM(vi.subtotal), 0)::float8 AS "totalGenerado"
      FROM venta_item vi
      JOIN venta v ON v.id = vi.venta_id
      WHERE ($1::timestamp IS NULL OR v.fecha >= $1::timestamp)
        AND ($2::timestamp IS NULL OR v.fecha <= $2::timestamp)
        AND ($3::int IS NULL OR v.almacen_id = $3::int)
        AND vi.producto_id IS NULL
        AND COALESCE(vi.subtotal, 0) > 0
    )
    SELECT * FROM por_categoria
    UNION ALL
    SELECT * FROM promos
    WHERE "totalGenerado" > 0
    ORDER BY "totalGenerado" DESC;
    `,
      [desde, hasta, almacenParam],
    );
  }

  private async armarItemsVenta(
    dto: CreateVentaDto,
    manager: EntityManager,
  ): Promise<{ items: VentaItem[]; total: number }> {
    const items: VentaItem[] = [];
    let total = 0;

    for (const itemDto of dto.items ?? []) {
      const producto = await manager.getRepository(Producto).findOne({
        where: { id: itemDto.productoId },
        relations: ['unidad', 'categoria'],
      });

      if (!producto) {
        throw new NotFoundException(
          `Producto ${itemDto.productoId} no encontrado`,
        );
      }

      const granel = this.isGranel(producto);
      this.validarCantidadSegunProducto(producto, itemDto);

      const cantidadPiezas = granel ? 0 : Number(itemDto.cantidad);
      const cantidadGramos = granel ? Number(itemDto.cantidad_gramos) : 0;
      const unidadesFacturadas = granel
        ? cantidadGramos / 1000
        : cantidadPiezas;
      const precioUnitario = await this.productoService.getPrecioFinal(
        producto.id,
        dto.almacenId,
      );
      const subtotal = this.to2(unidadesFacturadas * precioUnitario);

      const ventaItem = new VentaItem();
      ventaItem.producto = producto;
      ventaItem.cantidad = granel ? null : cantidadPiezas;
      ventaItem.cantidad_gramos = granel
        ? this.to3(cantidadGramos).toFixed(3)
        : null;
      ventaItem.precioUnitario = precioUnitario;
      ventaItem.subtotal = subtotal;

      items.push(ventaItem);
      total += subtotal;
    }

    for (const promoItem of dto.promociones ?? []) {
      const promo = await this.promoService.getPromocionById(
        promoItem.promocionId,
      );
      if (!promo.activo) {
        throw new BadRequestException(
          `Promocion ${promoItem.promocionId} no esta activa`,
        );
      }
      if (!promo.productos?.length) {
        throw new BadRequestException(
          `Promocion ${promoItem.promocionId} no tiene productos`,
        );
      }

      const cantidadPromo = Number(promoItem.cantidad);
      if (!Number.isFinite(cantidadPromo) || cantidadPromo < 1) {
        throw new BadRequestException(
          'La cantidad de la promocion debe ser mayor a 0',
        );
      }

      const subtotalPromo = this.to2(Number(promo.precioPromo) * cantidadPromo);
      const promoVentaItem = new VentaItem();
      promoVentaItem.producto = null;
      promoVentaItem.cantidad = cantidadPromo;
      promoVentaItem.cantidad_gramos = null;
      promoVentaItem.precioUnitario = Number(promo.precioPromo);
      promoVentaItem.subtotal = subtotalPromo;
      items.push(promoVentaItem);
      total += subtotalPromo;

      for (const promoProducto of promo.productos) {
        const producto = promoProducto.producto;
        const granel = this.isGranel(producto);
        const ventaItem = new VentaItem();
        ventaItem.producto = producto;
        ventaItem.precioUnitario = 0;
        ventaItem.subtotal = 0;

        if (granel) {
          const gramosTotales =
            Number(promoProducto.cantidad_gramos ?? 0) * cantidadPromo;
          if (!Number.isFinite(gramosTotales) || gramosTotales <= 0) {
            throw new BadRequestException(
              `La promocion ${promo.id} tiene gramos invalidos para producto ${producto.id}`,
            );
          }
          ventaItem.cantidad = null;
          ventaItem.cantidad_gramos = this.to3(gramosTotales).toFixed(3);
        } else {
          const piezasTotales =
            Number(promoProducto.cantidad ?? 0) * cantidadPromo;
          if (!Number.isFinite(piezasTotales) || piezasTotales <= 0) {
            throw new BadRequestException(
              `La promocion ${promo.id} tiene cantidad invalida para producto ${producto.id}`,
            );
          }
          ventaItem.cantidad = piezasTotales;
          ventaItem.cantidad_gramos = null;
        }

        items.push(ventaItem);
      }
    }

    return { items, total: this.to2(total) };
  }

  private validarCantidadSegunProducto(producto: Producto, item: any) {
    const granel = this.isGranel(producto);
    const tienePiezas = item.cantidad !== undefined && item.cantidad !== null;
    const tieneGramos =
      item.cantidad_gramos !== undefined && item.cantidad_gramos !== null;

    if (granel) {
      if (!tieneGramos || tienePiezas) {
        throw new BadRequestException(
          `Producto ${producto.id} se vende por gramos: enviar solo cantidad_gramos`,
        );
      }
      return;
    }

    if (!tienePiezas || tieneGramos) {
      throw new BadRequestException(
        `Producto ${producto.id} se vende por piezas: enviar solo cantidad`,
      );
    }
  }

  private normalizarPagos(
    pagos: CreateVentaDto['pagos'],
  ): Array<{ medio: MedioPagoVenta; monto: number }> {
    const acumulados = new Map<MedioPagoVenta, number>();

    for (const pago of pagos ?? []) {
      const medio = normalizarMedioPago(pago.medio);
      if (medio !== 'EFECTIVO' && medio !== 'BANCARIZADO') {
        throw new BadRequestException(
          'medio debe ser EFECTIVO, BANCARIZADO o un alias bancarizado valido',
        );
      }

      const monto = Number(pago.monto);
      if (!Number.isFinite(monto) || monto <= 0) {
        throw new BadRequestException(
          'Cada pago debe tener un monto mayor a 0',
        );
      }

      acumulados.set(medio, this.to2((acumulados.get(medio) ?? 0) + monto));
    }

    if (acumulados.size === 0) {
      throw new BadRequestException('La venta debe incluir al menos un pago');
    }

    return [...acumulados.entries()].map(([medio, monto]) => ({
      medio,
      monto: this.to2(monto),
    }));
  }

  private validarTotalPagos(
    pagos: Array<{ medio: MedioPagoVenta; monto: number }>,
    total: number,
  ) {
    const totalPagos = this.to2(
      pagos.reduce((acc, pago) => acc + Number(pago.monto), 0),
    );

    if (Math.abs(totalPagos - total) > 0.01) {
      throw new BadRequestException(
        `La suma de pagos (${totalPagos}) debe coincidir con el total de la venta (${total})`,
      );
    }
  }

  private async descontarStockYRegistrarMovimientoTx(
    manager: EntityManager,
    item: VentaItem,
    almacenId: number,
    ventaId: number,
  ) {
    const producto = item.producto;
    if (!producto) return;

    const piezas = Number(item.cantidad ?? 0);
    const gramos = Number(item.cantidad_gramos ?? 0);
    if (piezas <= 0 && gramos <= 0) return;

    await manager.query(
      `INSERT INTO stock_actual (producto_id, almacen_id, cantidad, cantidad_gramos)
       VALUES ($1,$2,0,NULL)
       ON CONFLICT (producto_id, almacen_id) DO NOTHING`,
      [producto.id, almacenId],
    );

    const stockRepo = manager.getRepository(StockActual);
    const stock = await stockRepo
      .createQueryBuilder('stock')
      .where(
        'stock.producto_id = :productoId AND stock.almacen_id = :almacenId',
        { productoId: producto.id, almacenId },
      )
      .setLock('pessimistic_write')
      .getOne();

    if (!stock) {
      throw new NotFoundException(
        `No existe stock para producto ${producto.id} en almacen ${almacenId}`,
      );
    }

    if (this.isGranel(producto)) {
      stock.cantidad = 0;
      stock.cantidad_gramos = this.to3(
        Number(stock.cantidad_gramos ?? 0) - gramos,
      ).toFixed(3);
    } else {
      stock.cantidad = Number(stock.cantidad ?? 0) - piezas;
      stock.cantidad_gramos = null;
    }

    await stockRepo.save(stock);

    await manager.getRepository(MovimientoStock).save({
      producto_id: producto.id,
      origen_almacen: almacenId,
      destino_almacen: undefined,
      cantidad: piezas > 0 ? piezas : undefined,
      cantidad_gramos: gramos > 0 ? this.to3(gramos).toFixed(3) : undefined,
      tipo: 'salida',
      motivo: `Venta #${ventaId}`,
    });
  }
  private isGranel(prod: any): boolean {
    return prod?.es_por_gramos === true || prod?.unidad?.codigo === 'g';
  }
  private to2(n: number) {
    return Number(n.toFixed(2));
  }
  private to3(n: number) {
    return Number(n.toFixed(3));
  }
}
