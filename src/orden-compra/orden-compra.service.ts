// src/orden-compra/orden-compra.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { OrdenCompra, OrdenCompraEstado } from './orden-compra.entity';
import { OrdenCompraItem } from './orden-compra-item.entity';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';
import { AnularOrdenCompraDto } from './dto/anular-orden-compra.dto';
import { UpdateOrdenCompraDto } from './dto/update-orden-compra.dto';
import { MovimientoStock } from 'src/movimiento-stock/movimiento-stock.entity';
import { StockActual } from 'src/stock-actual/stock-actual.entity';
import { FiltroOrdenCompraDto } from './dto/filtro-orden-compra.dto';
import { Producto } from 'src/producto/producto.entity';
import { Proveedor } from 'src/proveedor/proveedor.entity';
import { Gasto, GastoOrigen } from 'src/gastos/gasto.entity';

type OrdenCompraItemProcesado = {
  producto: Producto;
  productoId: number;
  esPorGramos: boolean;
  cantidad?: number;
  cantidad_gramos?: number;
  precioUnitario: number;
  subtotal: number;
  fechaVencimiento?: string;
};

type StockCompraSnapshot = {
  producto: Producto;
  productoId: number;
  ordenCompraItemId: number | null;
  esPorGramos: boolean;
  cantidad: number;
  cantidad_gramos: number;
  precioUnitario: number;
};



@Injectable()
export class OrdenCompraService {
  constructor(
    @InjectRepository(OrdenCompra)
    private ordenRepo: Repository<OrdenCompra>,

    private dataSource: DataSource,
  ) {}

  async crearOrdenConStock(dto: CreateOrdenCompraDto) {
    return await this.dataSource.transaction(async manager => {
      const { proveedorId, almacenId, usuarioId, items } = dto;
      const proveedor = await this.getProveedorOrFail(manager, proveedorId);

      // Calculamos subtotales con validación por item
      const itemsProcesados: Array<{
        producto: Producto;
        productoId: number;
        esPorGramos: boolean;
        cantidad?: number;
        cantidad_gramos?: number;
        precioUnitario: number;
        subtotal: number;
        fechaVencimiento?: string;
      }> = [];

      for (const i of items) {
        const producto = await manager.findOne(Producto, { where: { id: i.productoId } });
        if (!producto) {
          throw new NotFoundException(`Producto ${i.productoId} no encontrado`);
        }

        const esPorGramos = !!producto.es_por_gramos;

        // Validaciones "uno u otro"
        const traePiezas = i.cantidad != null && i.cantidad !== undefined;
        const traeGramos = i.cantidad_gramos != null && i.cantidad_gramos !== undefined;

        if (esPorGramos) {
          if (!traeGramos || traePiezas) {
            throw new BadRequestException(
              `El producto ${producto.nombre} se maneja por gramos: enviar 'cantidad_gramos' (y NO 'cantidad').`,
            );
          }
        } else {
          if (!traePiezas || traeGramos) {
            throw new BadRequestException(
              `El producto ${producto.nombre} se maneja por piezas: enviar 'cantidad' (y NO 'cantidad_gramos').`,
            );
          }
        }

        // Semántica precioUnitario:
        // - Por piezas: precio por pieza
        // - Por gramos: precio por gramo
        // Si preferís manejar "precio por KG", descomentar:
        // const precioUnitario = esPorGramos ? (i.precioUnitario / 1000) : i.precioUnitario;
        const precioUnitario = i.precioUnitario;

        const cantidad = traePiezas ? i.cantidad! : undefined;
        const cantidad_gramos = traeGramos ? i.cantidad_gramos! : undefined;

        const base = esPorGramos ? cantidad_gramos! / 1000 : cantidad!;
        const subtotal = Number((base * precioUnitario).toFixed(2));

        itemsProcesados.push({
          producto,
          productoId: i.productoId,
          esPorGramos,
          cantidad,
          cantidad_gramos,
          precioUnitario,
          subtotal,
          fechaVencimiento: i.fechaVencimiento,
        });
      }

      // Total de la orden con subtotales ya validados
      const totalOrden = itemsProcesados.reduce((acc, it) => acc + it.subtotal, 0);

      // 1) Crear orden
      const orden = manager.create(OrdenCompra, {
        proveedor: { id: proveedorId },
        almacen_id: almacenId,
        fecha: new Date(),
        total: totalOrden,
        estado: OrdenCompraEstado.ACTIVA,
        gastoId: null,
        numeroComprobante: this.clean(dto.numeroComprobante) ?? null,
        observacion: this.clean(dto.observacion) ?? null,
        motivoAnulacion: null,
        fechaAnulacion: null,
      });
      await manager.save(orden);

      // 2) Crear items + 3) movimiento stock + 4) actualizar stock
      for (const it of itemsProcesados) {
        // 2) item
        const ordenItem = manager.create(OrdenCompraItem, {
          orden: orden,
          producto: { id: it.productoId },
          cantidad: it.esPorGramos ? null : it.cantidad!,
          cantidad_gramos: it.esPorGramos ? (Number(it.cantidad_gramos!.toFixed(3)).toString()) : null, // guardamos como string para NUMERIC
          precioUnitario: it.precioUnitario,
          subtotal: it.subtotal,
          fechaVencimiento: it.fechaVencimiento ?? null,
        });
        await manager.save(ordenItem);

        // 3) movimiento
        

        const movimiento = new MovimientoStock();
        movimiento.producto_id     = it.productoId;
        movimiento.destino_almacen = almacenId;
        movimiento.cantidad        = it.esPorGramos ? null : it.cantidad!;
        movimiento.cantidad_gramos = it.esPorGramos ? it.cantidad_gramos!.toFixed(3) : null;
        movimiento.tipo            = 'entrada';
        movimiento.usuario_id      = usuarioId;
        movimiento.proveedor_id    = proveedorId;
        movimiento.precioUnitario  = it.precioUnitario;
        movimiento.precioTotal     = it.subtotal;
        movimiento.motivo          = 'Ingreso por orden de compra';
        movimiento.ordenCompraId   = orden.id;
        movimiento.ordenCompraItemId = ordenItem.id;

        await manager.save(movimiento);




        // 4) stock_actual
        let stock = await manager.findOne(StockActual, {
          where: {
            producto: { id: it.productoId },
            almacen: { id: almacenId },
          },
        });

        if (stock) {
          if (it.esPorGramos) {
            const actual = stock.cantidad_gramos ? Number(stock.cantidad_gramos) : 0;
            const nuevo = actual < 0 ? it.cantidad_gramos! : actual + it.cantidad_gramos!;
            stock.cantidad_gramos = nuevo.toFixed(3);
            // aseguramos piezas en 0 si es por gramos
            if (stock.cantidad == null) stock.cantidad = 0;
          } else {
            const actual = stock.cantidad ?? 0;
            stock.cantidad = actual < 0 ? it.cantidad! : actual + it.cantidad!;
            // aseguramos gramos nulo/0 si es por piezas (opcional)
            if (!stock.cantidad_gramos) stock.cantidad_gramos = null;
          }
          // UpdateDateColumn maneja last_updated solo
          await manager.save(stock);
        } else {
          // crear registro nuevo
          const nuevoStock = manager.create(StockActual, {
            producto: { id: it.productoId },
            almacen: { id: almacenId },
            cantidad: it.esPorGramos ? 0 : it.cantidad!,
            cantidad_gramos: it.esPorGramos ? it.cantidad_gramos!.toFixed(3) : null,
            // last_updated lo setea automáticamente el @UpdateDateColumn al update posterior;
            // en insert no aplica, pero no es necesario setearlo manualmente
          });
          await manager.save(nuevoStock);
        }
      }

      const gasto = manager.create(Gasto, {
        fecha: this.toDateOnly(orden.fecha),
        monto: totalOrden.toFixed(2),
        descripcion: `Orden de compra #${orden.id} - ${proveedor.nombre}`,
        notas: this.buildGastoNotas(dto),
        origen: GastoOrigen.ORDEN_COMPRA,
        ordenCompraId: orden.id,
      });
      await manager.save(gasto);

      orden.gastoId = gasto.id;
      orden.gasto = gasto;
      await manager.save(orden);

      return {
        mensaje: 'Stock ingresado, orden de compra registrada y gasto generado',
        ordenId: orden.id,
        gastoId: gasto.id,
        total: totalOrden.toFixed(2),
      };
    });
  }

  async obtenerDetalle(id: number) {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: [
        'proveedor',
        'gasto',
        'items',
        'items.producto',
        'movimientos',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden de compra ${id} no encontrada`);
    }

    return orden;
  }

  async actualizarOrden(id: number, dto: UpdateOrdenCompraDto) {
    await this.dataSource.transaction(async manager => {
      const orden = await this.obtenerOrdenBloqueadaConDetalle(manager, id);

      if (!orden) {
        throw new NotFoundException(`Orden de compra ${id} no encontrada`);
      }

      if (orden.estado === OrdenCompraEstado.ANULADA) {
        throw new BadRequestException(
          `La orden de compra ${id} esta anulada y no puede editarse`,
        );
      }

      if (!orden.almacen_id) {
        throw new BadRequestException(
          `La orden de compra ${id} no tiene almacen asociado`,
        );
      }

      const proveedor = await this.getProveedorOrFail(manager, dto.proveedorId);

      const itemsProcesados = await this.procesarItemsOrden(dto.items, manager);
      const totalOrden = itemsProcesados.reduce(
        (acc, it) => acc + it.subtotal,
        0,
      );
      const itemsAnteriores = this.snapshotItems(orden.items ?? []);
      const almacenAnteriorId = orden.almacen_id;
      const almacenNuevoId = dto.almacenId;

      const itemsGuardados = await this.reemplazarItemsOrden(
        manager,
        orden,
        itemsProcesados,
      );

      if (almacenAnteriorId === almacenNuevoId) {
        await this.aplicarDeltasMismoAlmacen({
          manager,
          orden,
          almacenId: almacenNuevoId,
          anteriores: itemsAnteriores,
          nuevos: itemsProcesados,
          itemsGuardados,
          proveedorId: dto.proveedorId,
          usuarioId: dto.usuarioId,
        });
      } else {
        await this.revertirSnapshots({
          manager,
          orden,
          almacenId: almacenAnteriorId,
          snapshots: itemsAnteriores,
          usuarioId: dto.usuarioId,
          proveedorId: orden.proveedor?.id ?? dto.proveedorId,
          motivo: `Edicion orden de compra #${orden.id}: reverso por cambio de almacen`,
        });
        await this.aplicarEntradasProcesadas({
          manager,
          orden,
          almacenId: almacenNuevoId,
          items: itemsProcesados,
          itemsGuardados,
          usuarioId: dto.usuarioId,
          proveedorId: dto.proveedorId,
          motivo: `Edicion orden de compra #${orden.id}: nueva version`,
        });
      }

      orden.proveedor = proveedor;
      orden.almacen_id = almacenNuevoId;
      orden.total = totalOrden;
      orden.numeroComprobante = this.clean(dto.numeroComprobante) ?? null;
      orden.observacion = this.clean(dto.observacion) ?? null;
      await manager.save(orden);

      await this.actualizarGastoOrden(manager, orden, proveedor, dto, totalOrden);
    });

    return this.obtenerDetalle(id);
  }

  async anularOrden(id: number, dto: AnularOrdenCompraDto) {
    const motivoAnulacion = dto.motivoAnulacion?.trim();
    if (!motivoAnulacion) {
      throw new BadRequestException('motivoAnulacion es obligatorio');
    }

    await this.dataSource.transaction(async manager => {
      const orden = await this.obtenerOrdenBloqueadaConDetalle(manager, id);

      if (!orden) {
        throw new NotFoundException(`Orden de compra ${id} no encontrada`);
      }

      if (orden.estado === OrdenCompraEstado.ANULADA) {
        throw new BadRequestException(`La orden de compra ${id} ya esta anulada`);
      }

      if (!orden.almacen_id) {
        throw new BadRequestException(
          `La orden de compra ${id} no tiene almacen asociado para revertir stock`,
        );
      }

      if (!orden.items?.length) {
        throw new BadRequestException(
          `La orden de compra ${id} no tiene items para revertir`,
        );
      }

      await this.revertirSnapshots({
        manager,
        orden,
        almacenId: orden.almacen_id,
        snapshots: this.snapshotItems(orden.items),
        usuarioId: dto.usuarioId ?? null,
        proveedorId: orden.proveedor?.id ?? null,
        motivo: `Anulacion orden de compra #${orden.id}: ${motivoAnulacion}`,
      });

      if (orden.gastoId) {
        await manager.getRepository(Gasto).softDelete({ id: orden.gastoId });
      }

      orden.estado = OrdenCompraEstado.ANULADA;
      orden.motivoAnulacion = motivoAnulacion;
      orden.fechaAnulacion = new Date();
      await manager.save(orden);
    });

    return this.obtenerDetalle(id);
  }

  private async obtenerOrdenBloqueadaConDetalle(
    manager: EntityManager,
    id: number,
  ): Promise<OrdenCompra | null> {
    const repo = manager.getRepository(OrdenCompra);
    const ordenBloqueada = await repo
      .createQueryBuilder('orden')
      .where('orden.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    if (!ordenBloqueada) return null;

    return repo.findOne({
      where: { id },
      relations: ['proveedor', 'items', 'items.producto'],
    });
  }

  private async getProveedorOrFail(
    manager: EntityManager,
    proveedorId: number,
  ): Promise<Proveedor> {
    const proveedor = await manager.findOne(Proveedor, {
      where: { id: proveedorId },
    });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor ${proveedorId} no encontrado`);
    }
    return proveedor;
  }

  private async procesarItemsOrden(
    items: CreateOrdenCompraDto['items'],
    manager: EntityManager,
  ): Promise<OrdenCompraItemProcesado[]> {
    const procesados: OrdenCompraItemProcesado[] = [];

    for (const i of items) {
      const producto = await manager.findOne(Producto, {
        where: { id: i.productoId },
      });
      if (!producto) {
        throw new NotFoundException(`Producto ${i.productoId} no encontrado`);
      }

      const esPorGramos = !!producto.es_por_gramos;
      const traePiezas = i.cantidad != null;
      const traeGramos = i.cantidad_gramos != null;

      if (esPorGramos) {
        if (!traeGramos || traePiezas) {
          throw new BadRequestException(
            `El producto ${producto.nombre} se maneja por gramos: enviar 'cantidad_gramos' y no 'cantidad'.`,
          );
        }
      } else if (!traePiezas || traeGramos) {
        throw new BadRequestException(
          `El producto ${producto.nombre} se maneja por piezas: enviar 'cantidad' y no 'cantidad_gramos'.`,
        );
      }

      const precioUnitario = Number(i.precioUnitario);
      if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
        throw new BadRequestException(
          `El producto ${producto.nombre} debe tener precioUnitario mayor a 0`,
        );
      }

      const cantidad = traePiezas ? Number(i.cantidad) : undefined;
      const cantidad_gramos = traeGramos ? Number(i.cantidad_gramos) : undefined;
      const base = esPorGramos ? cantidad_gramos! / 1000 : cantidad!;
      const subtotal = Number((base * precioUnitario).toFixed(2));

      procesados.push({
        producto,
        productoId: producto.id,
        esPorGramos,
        cantidad,
        cantidad_gramos,
        precioUnitario,
        subtotal,
        fechaVencimiento: i.fechaVencimiento,
      });
    }

    return procesados;
  }

  private snapshotItems(items: OrdenCompraItem[]): StockCompraSnapshot[] {
    return items.map(item => ({
      producto: item.producto,
      productoId: item.producto.id,
      ordenCompraItemId: item.id,
      esPorGramos: item.cantidad_gramos != null,
      cantidad: Number(item.cantidad ?? 0),
      cantidad_gramos: Number(item.cantidad_gramos ?? 0),
      precioUnitario: Number(item.precioUnitario ?? 0),
    }));
  }

  private async reemplazarItemsOrden(
    manager: EntityManager,
    orden: OrdenCompra,
    items: OrdenCompraItemProcesado[],
  ): Promise<Map<number, OrdenCompraItem>> {
    if (orden.items?.length) {
      const itemIds = orden.items
        .map(item => item.id)
        .filter((itemId): itemId is number => itemId != null);

      if (itemIds.length > 0) {
        await manager
          .getRepository(MovimientoStock)
          .createQueryBuilder()
          .update(MovimientoStock)
          .set({ ordenCompraItemId: null })
          .where('orden_compra_item_id IN (:...itemIds)', { itemIds })
          .execute();
      }

      await manager.getRepository(OrdenCompraItem).remove(orden.items);
    }

    const guardados = new Map<number, OrdenCompraItem>();
    for (const it of items) {
      const item = manager.create(OrdenCompraItem, {
        orden,
        producto: { id: it.productoId },
        cantidad: it.esPorGramos ? null : it.cantidad!,
        cantidad_gramos: it.esPorGramos
          ? Number(it.cantidad_gramos!.toFixed(3)).toString()
          : null,
        precioUnitario: it.precioUnitario,
        subtotal: it.subtotal,
        fechaVencimiento: it.fechaVencimiento ?? null,
      });
      const guardado = await manager.save(item);
      if (!guardados.has(it.productoId)) {
        guardados.set(it.productoId, guardado);
      }
    }

    return guardados;
  }

  private async aplicarDeltasMismoAlmacen(params: {
    manager: EntityManager;
    orden: OrdenCompra;
    almacenId: number;
    anteriores: StockCompraSnapshot[];
    nuevos: OrdenCompraItemProcesado[];
    itemsGuardados: Map<number, OrdenCompraItem>;
    proveedorId: number;
    usuarioId: number;
  }) {
    const productosIds = new Set<number>([
      ...params.anteriores.map(i => i.productoId),
      ...params.nuevos.map(i => i.productoId),
    ]);

    for (const productoId of productosIds) {
      const anterior = this.totalizarSnapshots(
        params.anteriores.filter(i => i.productoId === productoId),
      );
      const nuevo = this.totalizarProcesados(
        params.nuevos.filter(i => i.productoId === productoId),
      );
      const producto = nuevo.producto ?? anterior.producto;
      const esPorGramos = nuevo.esPorGramos ?? anterior.esPorGramos;

      if (esPorGramos) {
        const delta = Number((nuevo.cantidad_gramos - anterior.cantidad_gramos).toFixed(3));
        if (delta !== 0) {
          await this.aplicarDeltaStock({
            manager: params.manager,
            orden: params.orden,
            producto,
            almacenId: params.almacenId,
            deltaGramos: delta,
            usuarioId: params.usuarioId,
            proveedorId: params.proveedorId,
            precioUnitario:
              delta > 0 ? nuevo.precioUnitario : anterior.precioUnitario,
            ordenCompraItemId: params.itemsGuardados.get(productoId)?.id ?? null,
            motivo: `Edicion orden de compra #${params.orden.id}`,
          });
        }
      } else {
        const delta = nuevo.cantidad - anterior.cantidad;
        if (delta !== 0) {
          await this.aplicarDeltaStock({
            manager: params.manager,
            orden: params.orden,
            producto,
            almacenId: params.almacenId,
            deltaPiezas: delta,
            usuarioId: params.usuarioId,
            proveedorId: params.proveedorId,
            precioUnitario:
              delta > 0 ? nuevo.precioUnitario : anterior.precioUnitario,
            ordenCompraItemId: params.itemsGuardados.get(productoId)?.id ?? null,
            motivo: `Edicion orden de compra #${params.orden.id}`,
          });
        }
      }
    }
  }

  private async revertirSnapshots(params: {
    manager: EntityManager;
    orden: OrdenCompra;
    almacenId: number;
    snapshots: StockCompraSnapshot[];
    usuarioId: number | null;
    proveedorId: number | null;
    motivo: string;
  }) {
    for (const item of params.snapshots) {
      await this.aplicarDeltaStock({
        manager: params.manager,
        orden: params.orden,
        producto: item.producto,
        almacenId: params.almacenId,
        deltaPiezas: item.esPorGramos ? undefined : -item.cantidad,
        deltaGramos: item.esPorGramos ? -item.cantidad_gramos : undefined,
        usuarioId: params.usuarioId,
        proveedorId: params.proveedorId,
        precioUnitario: item.precioUnitario,
        ordenCompraItemId: item.ordenCompraItemId,
        motivo: params.motivo,
      });
    }
  }

  private async aplicarEntradasProcesadas(params: {
    manager: EntityManager;
    orden: OrdenCompra;
    almacenId: number;
    items: OrdenCompraItemProcesado[];
    itemsGuardados: Map<number, OrdenCompraItem>;
    usuarioId: number;
    proveedorId: number | null;
    motivo: string;
  }) {
    for (const item of params.items) {
      await this.aplicarDeltaStock({
        manager: params.manager,
        orden: params.orden,
        producto: item.producto,
        almacenId: params.almacenId,
        deltaPiezas: item.esPorGramos ? undefined : item.cantidad,
        deltaGramos: item.esPorGramos ? item.cantidad_gramos : undefined,
        usuarioId: params.usuarioId,
        proveedorId: params.proveedorId,
        precioUnitario: item.precioUnitario,
        ordenCompraItemId: params.itemsGuardados.get(item.productoId)?.id ?? null,
        motivo: params.motivo,
      });
    }
  }

  private async aplicarDeltaStock(params: {
    manager: EntityManager;
    orden: OrdenCompra;
    producto: Producto;
    almacenId: number;
    deltaPiezas?: number;
    deltaGramos?: number;
    usuarioId: number | null;
    proveedorId: number | null;
    precioUnitario: number;
    ordenCompraItemId: number | null;
    motivo: string;
  }) {
    const deltaPiezas = Number(params.deltaPiezas ?? 0);
    const deltaGramos = Number(params.deltaGramos ?? 0);
    if (deltaPiezas === 0 && deltaGramos === 0) return;

    let stock = await params.manager
      .getRepository(StockActual)
      .createQueryBuilder('stock')
      .where('stock.producto_id = :productoId', { productoId: params.producto.id })
      .andWhere('stock.almacen_id = :almacenId', { almacenId: params.almacenId })
      .setLock('pessimistic_write')
      .getOne();

    if (!stock && (deltaPiezas < 0 || deltaGramos < 0)) {
      throw new BadRequestException(
        `No hay stock actual para revertir el producto ${params.producto.id} en almacen ${params.almacenId}`,
      );
    }

    if (!stock) {
      stock = params.manager.create(StockActual, {
        producto: { id: params.producto.id },
        almacen: { id: params.almacenId },
        cantidad: 0,
        cantidad_gramos: params.producto.es_por_gramos ? '0.000' : null,
      });
    }

    if (deltaGramos !== 0) {
      const actual = Number(stock.cantidad_gramos ?? 0);
      const nuevo = Number((actual + deltaGramos).toFixed(3));
      if (nuevo < 0) {
        throw new BadRequestException(
          `Stock insuficiente para editar la orden. Producto ${params.producto.nombre}: disponible ${actual.toFixed(3)}g, requerido ${Math.abs(deltaGramos).toFixed(3)}g`,
        );
      }
      stock.cantidad_gramos = nuevo.toFixed(3);
      if (stock.cantidad == null) stock.cantidad = 0;
    } else {
      const actual = Number(stock.cantidad ?? 0);
      const nuevo = actual + deltaPiezas;
      if (nuevo < 0) {
        throw new BadRequestException(
          `Stock insuficiente para editar la orden. Producto ${params.producto.nombre}: disponible ${actual}, requerido ${Math.abs(deltaPiezas)}`,
        );
      }
      stock.cantidad = nuevo;
      if (!stock.cantidad_gramos) stock.cantidad_gramos = null;
    }

    await params.manager.save(stock);

    const cantidadBase = deltaGramos !== 0
      ? Math.abs(deltaGramos) / 1000
      : Math.abs(deltaPiezas);
    const precioTotal = Number((cantidadBase * Number(params.precioUnitario ?? 0)).toFixed(2));

    await params.manager.getRepository(MovimientoStock).save({
      producto_id: params.producto.id,
      origen_almacen: deltaPiezas < 0 || deltaGramos < 0 ? params.almacenId : null,
      destino_almacen: deltaPiezas > 0 || deltaGramos > 0 ? params.almacenId : null,
      cantidad: deltaGramos === 0 ? Math.abs(deltaPiezas) : null,
      cantidad_gramos: deltaGramos !== 0 ? Math.abs(deltaGramos).toFixed(3) : null,
      tipo: deltaPiezas < 0 || deltaGramos < 0 ? 'salida' : 'entrada',
      usuario_id: params.usuarioId,
      proveedor_id: params.proveedorId,
      precioUnitario: params.precioUnitario,
      precioTotal,
      motivo: params.motivo,
      ordenCompraId: params.orden.id,
      ordenCompraItemId: params.ordenCompraItemId,
    });
  }

  private totalizarSnapshots(items: StockCompraSnapshot[]) {
    return items.reduce(
      (acc, item) => ({
        producto: acc.producto ?? item.producto,
        esPorGramos: acc.esPorGramos ?? item.esPorGramos,
        cantidad: acc.cantidad + item.cantidad,
        cantidad_gramos: acc.cantidad_gramos + item.cantidad_gramos,
        precioUnitario: item.precioUnitario,
      }),
      {
        producto: undefined as Producto | undefined,
        esPorGramos: undefined as boolean | undefined,
        cantidad: 0,
        cantidad_gramos: 0,
        precioUnitario: 0,
      },
    );
  }

  private totalizarProcesados(items: OrdenCompraItemProcesado[]) {
    return items.reduce(
      (acc, item) => ({
        producto: acc.producto ?? item.producto,
        esPorGramos: acc.esPorGramos ?? item.esPorGramos,
        cantidad: acc.cantidad + Number(item.cantidad ?? 0),
        cantidad_gramos: acc.cantidad_gramos + Number(item.cantidad_gramos ?? 0),
        precioUnitario: item.precioUnitario,
      }),
      {
        producto: undefined as Producto | undefined,
        esPorGramos: undefined as boolean | undefined,
        cantidad: 0,
        cantidad_gramos: 0,
        precioUnitario: 0,
      },
    );
  }

  private async actualizarGastoOrden(
    manager: EntityManager,
    orden: OrdenCompra,
    proveedor: Proveedor,
    dto: CreateOrdenCompraDto,
    totalOrden: number,
  ) {
    let gasto = orden.gastoId
      ? await manager.getRepository(Gasto).findOne({
          where: { id: orden.gastoId },
          withDeleted: true,
        })
      : null;

    if (gasto?.deletedAt) {
      await manager.getRepository(Gasto).recover(gasto);
      gasto.deletedAt = null;
    }

    if (!gasto) {
      gasto = manager.create(Gasto, {
        fecha: this.toDateOnly(orden.fecha),
        origen: GastoOrigen.ORDEN_COMPRA,
        ordenCompraId: orden.id,
      });
    }

    gasto.fecha = this.toDateOnly(orden.fecha);
    gasto.monto = totalOrden.toFixed(2);
    gasto.descripcion = `Orden de compra #${orden.id} - ${proveedor.nombre}`;
    gasto.notas = this.buildGastoNotas(dto);
    gasto.origen = GastoOrigen.ORDEN_COMPRA;
    gasto.ordenCompraId = orden.id;

    const gastoGuardado = await manager.save(gasto);
    if (orden.gastoId !== gastoGuardado.id) {
      orden.gastoId = gastoGuardado.id;
      orden.gasto = gastoGuardado;
      await manager.save(orden);
    }
  }

  private clean(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    const cleaned = value?.trim();
    return cleaned || null;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildGastoNotas(dto: CreateOrdenCompraDto): string | null {
    const notas = [
      'Gasto generado automaticamente desde orden de compra.',
      dto.numeroComprobante?.trim()
        ? `Comprobante: ${dto.numeroComprobante.trim()}.`
        : null,
      dto.observacion?.trim() ? `Observacion: ${dto.observacion.trim()}` : null,
    ].filter(Boolean);

    return notas.length > 0 ? notas.join(' ') : null;
  }

async obtenerTodasConFiltros(filtros: FiltroOrdenCompraDto) {
  const pagina = filtros.pagina ?? 1;
  const limite = filtros.limite ?? 50;

  const query = this.ordenRepo.createQueryBuilder('orden')
    .leftJoin('orden.proveedor', 'proveedor')
    .leftJoin('orden.gasto', 'gasto')
    .leftJoin('orden.items', 'items')
    .leftJoin('items.producto', 'producto')
    .leftJoin('producto.unidad', 'unidad')
    .leftJoin('producto.categoria', 'categoria')
    .select([
      'orden.id',
      'orden.fecha',
      'orden.almacen_id',
      'orden.total',
      'orden.estado',
      'orden.gastoId',
      'orden.numeroComprobante',
      'orden.observacion',
      'orden.motivoAnulacion',
      'orden.fechaAnulacion',
      'proveedor.id',
      'proveedor.nombre',
      'gasto.id',
      'gasto.fecha',
      'gasto.monto',
      'gasto.descripcion',
      'gasto.origen',
      'items.id',
      'items.cantidad',
      'items.cantidad_gramos',
      'items.precioUnitario',
      'items.subtotal',
      'items.fechaVencimiento',
      'producto.id',
      'producto.nombre',
      'unidad.id',
      'unidad.nombre',
      'categoria.id',
      'categoria.nombre',
    ]);

  if (filtros.fechaDesde) {
    query.andWhere('orden.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
  }

  if (filtros.fechaHasta) {
    query.andWhere('orden.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
  }

  if (filtros.proveedorId) {
    query.andWhere('proveedor.id = :proveedorId', { proveedorId: filtros.proveedorId });
  }

  if (filtros.almacenId) {
    query.andWhere('orden.almacen_id = :almacenId', { almacenId: filtros.almacenId });
  }

  if (filtros.fechaVencimientoDesde) {
    query.andWhere('items.fecha_vencimiento >= :fechaVencimientoDesde', {
      fechaVencimientoDesde: filtros.fechaVencimientoDesde,
    });
  }

  if (filtros.fechaVencimientoHasta) {
    query.andWhere('items.fecha_vencimiento <= :fechaVencimientoHasta', {
      fechaVencimientoHasta: filtros.fechaVencimientoHasta,
    });
  }

  const [data, total] = await query
    .orderBy('orden.fecha', 'DESC')
    .skip((pagina - 1) * limite)
    .take(limite)
    .getManyAndCount();

  const resultado = data.map((orden) => ({
    id: orden.id,
    fecha: orden.fecha,
    almacen_id: (orden as any).almacen_id ?? null,
    total: orden.total,
    estado: orden.estado,
    numeroComprobante: orden.numeroComprobante,
    observacion: orden.observacion,
    motivoAnulacion: orden.motivoAnulacion,
    fechaAnulacion: orden.fechaAnulacion,
    gasto: orden.gasto
      ? {
          id: orden.gasto.id,
          fecha: orden.gasto.fecha,
          monto: orden.gasto.monto,
          descripcion: orden.gasto.descripcion,
          origen: orden.gasto.origen,
        }
      : null,
    proveedor: {
      id: orden.proveedor.id,
      nombre: orden.proveedor.nombre,
    },
    items: orden.items.map((item) => ({
      id: item.id,
      cantidad: item.cantidad,
      cantidad_gramos: item['cantidad_gramos'] ?? null,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal,
      fechaVencimiento: item.fechaVencimiento ?? null,
      producto: {
        id: item.producto.id,
        nombre: item.producto.nombre,
        unidad_id: item.producto.unidad?.id,
        unidad_nombre: item.producto.unidad?.nombre,
        categoria_id: item.producto.categoria?.id,
        categoria_nombre: item.producto.categoria?.nombre,
      },
    })),
  }));

  return {
    data: resultado,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}




  findAll(): Promise<OrdenCompra[]> {
    return this.ordenRepo.find({
      relations: ['proveedor', 'gasto', 'items', 'items.producto', 'movimientos'],
    });
  }

  async findOne(id: number): Promise<OrdenCompra> {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: ['proveedor', 'gasto', 'items', 'items.producto', 'movimientos'],
    });
    if (!orden) {
      throw new Error(`OrdenCompra with id ${id} not found`);
    }
    return orden;
  }

  

}
