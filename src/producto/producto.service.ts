import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { BuscarProductoDto } from './dto/buscar-producto.dto';
import { BuscarProductoFastDto } from './dto/buscar-producto-fast.dto';
import { StockActual } from 'src/stock-actual/stock-actual.entity';
import { Unidad } from 'src/unidad/unidad.entity';

// arriba junto a los existentes
import { In } from 'typeorm';
import { ProductoPrecioAlmacen } from 'src/producto-precio-almacen/producto-precio-almacen.entity';
import { UpdateProductoCargaRapidaDto } from './dto/update-producto-carga-rapida.dto';
import { Usuario } from 'src/usuario/usuario.entity';
import { PrecioHistorialTipo, ProductoPrecioHistorial } from 'src/producto-precio-historial/producto-precio-historial.entity';

const QUICK_BARCODE = '000000000000';

type AuthUser = { id?: number };

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private readonly repo: Repository<Producto>,
    @InjectRepository(Unidad) private readonly unidadRepo: Repository<Unidad>,
    @InjectRepository(ProductoPrecioAlmacen)
    private readonly ppaRepo: Repository<ProductoPrecioAlmacen>,

    @InjectRepository(ProductoPrecioHistorial)
    private readonly precioHistRepo: Repository<ProductoPrecioHistorial>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  private async resolveUserForAudit(user?: AuthUser) {
    const userId = user?.id;
    if (!userId) {
      return { usuario_id: null, usuario_nombre: null };
    }

    const u = await this.usuarioRepo.findOne({
      where: { id: userId },
      select: ['id', 'nombre', 'usuario'],
    });

    return {
      usuario_id: String(userId),
      usuario_nombre: u?.nombre ?? u?.usuario ?? String(userId),
    };
  }

  private async auditPrecio(params: {
    producto_id: number;
    almacen_id?: number | null;
    tipo: PrecioHistorialTipo;
    precio_anterior?: number | null;
    precio_nuevo?: number | null;
    origen: string;
    user?: AuthUser;
  }) {
    const who = await this.resolveUserForAudit(params.user);

    await this.precioHistRepo.insert({
      producto_id: params.producto_id,
      almacen_id: params.almacen_id ?? null,
      tipo: params.tipo,
      precio_anterior:
        params.precio_anterior == null ? null : String(params.precio_anterior),
      precio_nuevo:
        params.precio_nuevo == null ? null : String(params.precio_nuevo),
      usuario_id: who.usuario_id,
      usuario_nombre: who.usuario_nombre,
      origen: params.origen,
    });
  }

  private isQuickProducto(p?: Producto | null) {
    return !!p && p.barcode === QUICK_BARCODE;
  }

  private assertNotQuickProducto(p: Producto, action: string) {
    if (this.isQuickProducto(p)) {
      throw new BadRequestException(
        `El producto de carga rápida no permite: ${action}`,
      );
    }
  }

  /** Devuelve el precio final (override si existe para ese almacén; si no, precioBase) */
  async getPrecioFinal(
    productoId: number,
    almacenId?: number,
  ): Promise<number> {
    const prod = await this.repo.findOne({ where: { id: productoId } });
    if (!prod)
      throw new NotFoundException(`Producto ${productoId} no encontrado`);

    if (almacenId) {
      const override = await this.ppaRepo.findOne({
        where: { producto_id: productoId, almacen_id: almacenId },
      });
      if (override?.precio != null) {
        return this.getPrecioOverrideEfectivo(override);
      }
    }
    return Number(prod.precioBase ?? 0);
  }

  private getPrecioOverrideEfectivo(override: ProductoPrecioAlmacen): number {
    const inOferta = override.inOferta === true;
    const precioOfertaNum = Number(override.precioOferta ?? 0);
    if (inOferta && Number.isFinite(precioOfertaNum) && precioOfertaNum > 0) {
      return precioOfertaNum;
    }
    return Number(override.precio ?? 0);
  }

  private esGramos(u: Unidad | null | undefined) {
    const abbr = u?.abreviatura?.toLowerCase()?.trim();
    const name = u?.nombre?.toLowerCase()?.trim();
    return (
      abbr === 'g' ||
      abbr === 'gr' ||
      name === 'gramo' ||
      name?.startsWith('gram')
    );
  }

  async findAll(): Promise<Producto[]> {
    return (
      this.repo
        .createQueryBuilder('producto')
        .leftJoinAndSelect('producto.unidad', 'unidad')
        .leftJoinAndSelect('producto.categoria', 'categoria')
        .select([
          'producto.id',
          'producto.sku',
          'producto.nombre',
          'producto.descripcion',
          'producto.unidad_id',
          'producto.categoria_id',
          'producto.created_at',
          'producto.updated_at',
          'producto.barcode',
          'producto.precioBase',
          'producto.activo',
          'producto.inOferta',
          'producto.precio_updated_at',
          // ya lo tenías, lo dejamos
          'producto.es_por_gramos',
          'producto.proveedorNombre',
          'unidad.id',
          'unidad.nombre',
          'unidad.abreviatura',
          'categoria.id',
          'categoria.nombre',
          'categoria.descripcion',
        ])
        // 👇 fuerza la inclusión del flag en el mapeo a entidad
        .addSelect('producto.es_por_gramos')
        .getMany()
    );
  }

  /** Genera un SKU compuesto por un prefijo derivado del nombre
   *  y una cadena aleatoria de 6 caracteres. */
  private generateSku(nombre: string): string {
    // 1) Prefijo: primeras 3 letras (o hasta 5) en mayúsculas, sin espacios
    const prefix = nombre
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // elimina caracteres no alfanuméricos
      .substring(0, 5);

    // 2) Sufijo: 6 caracteres alfanuméricos aleatorios
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `${prefix}-${random}`;
  }
  // ────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateProductoDto): Promise<Producto> {
    const unidad = await this.unidadRepo.findOne({
      where: { id: dto.unidad_id },
    });
    if (!unidad) throw new NotFoundException('Unidad no encontrada');
    // 🔁 Generar SKU si no viene
    if (!dto.sku) {
      dto.sku = this.generateSku(dto.nombre);
    }

    // 🔎 Verificar duplicado por SKU
    const existingSku = await this.repo.findOne({ where: { sku: dto.sku } });
    if (existingSku) {
      throw new ConflictException(
        `El producto con SKU "${dto.sku}" ya existe.`,
      );
    }

    // 🔍 Verificar si existe un producto con el mismo código de barras
    if (dto.barcode) {
      const existingBarcode = await this.repo.findOne({
        where: { barcode: dto.barcode },
      });

      if (existingBarcode) {
        if (existingBarcode.activo) {
          throw new ConflictException(
            `Ya existe un producto activo con ese código de barras. Nombre: "${existingBarcode.nombre}".`,
          );
        } else {
          // 🛠️ Si existe pero está inactivo, lo actualizamos
          existingBarcode.nombre = dto.nombre;
          existingBarcode.descripcion = dto.descripcion;
          existingBarcode.unidad_id = dto.unidad_id;
          existingBarcode.categoria_id = dto.categoria_id;
          existingBarcode.sku = dto.sku;
          existingBarcode.precioBase = dto.precioBase;
          existingBarcode.activo = true;
          existingBarcode.inOferta = dto.inOferta ?? false;
          existingBarcode.updated_at = new Date();
          existingBarcode.proveedorNombre = dto.proveedorNombre ?? undefined;

          return this.repo.save(existingBarcode);
        }
      }
    }

    // ✅ Crear producto normalmente
    const nuevo = this.repo.create({
      sku: dto.sku,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precioBase: dto.precioBase,
      barcode: dto.barcode,
      unidad,
      categoria_id: dto.categoria_id,
      proveedorNombre: dto.proveedorNombre ?? undefined,
      inOferta: dto.inOferta ?? false,
      es_por_gramos: this.esGramos(unidad),
      ...(dto.precioBase != null ? { precio_updated_at: new Date() } : {}),
    });
    return this.repo.save(nuevo);
  }

  async findOne(id: number): Promise<Producto> {
    const idParsed = Number(id);

    // Si el ID no es un número entero válido, devolvemos un producto vacío
    if (!Number.isInteger(idParsed)) {
      return this.getDefaultProducto();
    }

    const prod = await this.repo.findOne({
      where: { id: idParsed },
      relations: ['unidad', 'categoria'],
    });

    return prod ?? this.getDefaultProducto();
  }
  private getDefaultProducto(): Producto {
    const defaultProducto = new Producto();
    defaultProducto.id = -1; // ID inválido
    defaultProducto.nombre = 'Producto no encontrado';
    defaultProducto.sku = 'N/A';
    defaultProducto.barcode = 'N/A';
    defaultProducto.inOferta = false;
    return defaultProducto;
  }

  async update(
    id: number,
    dto: UpdateProductoDto,
    user?: { id?: number },
  ): Promise<Producto> {
    const productoActual = await this.repo.findOne({ where: { id } });
    if (!productoActual)
      throw new NotFoundException(`Producto ${id} no encontrado`);

    if (this.isQuickProducto(productoActual)) {
      // solo permitimos nombre/descripcion/precioBase
      const allowed = ['nombre', 'descripcion', 'precioBase'];
      const keys = Object.keys(dto as any);

      const invalid = keys.filter((k) => !allowed.includes(k));
      if (invalid.length) {
        throw new BadRequestException(
          `Carga rápida: solo se puede editar ${allowed.join(', ')}. No permitido: ${invalid.join(', ')}`,
        );
      }
    }

    let unidad: Unidad | undefined;
    let es_por_gramos: boolean | undefined;

    if (dto.unidad_id !== undefined) {
      const unidadResult = await this.unidadRepo.findOne({
        where: { id: dto.unidad_id },
      });
      if (!unidadResult) throw new NotFoundException('Unidad no encontrada');
      unidad = unidadResult;
      es_por_gramos = this.esGramos(unidad);
    }

    const setPrecioUpdated = Object.prototype.hasOwnProperty.call(
      dto,
      'precioBase',
    )
      ? { precio_updated_at: new Date() }
      : {};

    const cambiaPrecioBase = Object.prototype.hasOwnProperty.call(
      dto,
      'precioBase',
    );

    if (cambiaPrecioBase) {
      const oldVal = Number(productoActual.precioBase ?? 0);
      const newVal = Number((dto as any).precioBase ?? 0);

      if (oldVal !== newVal) {
        await this.auditPrecio({
          producto_id: id,
          almacen_id: null,
          tipo: PrecioHistorialTipo.BASE,
          precio_anterior: oldVal,
          precio_nuevo: newVal,
          origen: 'PUT /productos/:id',
          user,
        });
      }
    }

    await this.repo.update({ id }, {
      ...dto,
      ...(unidad ? { unidad } : {}),
      ...(es_por_gramos !== undefined ? { es_por_gramos } : {}),
      ...setPrecioUpdated,
    } as any);

    const producto = await this.repo.findOne({
      where: { id },
      relations: ['unidad'],
    });
    if (!producto) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }
    return producto;
  }

  async remove(id: number): Promise<void> {
    const producto = await this.repo.findOne({ where: { id } });
    if (!producto) throw new NotFoundException(`Producto ${id} no encontrado`);
    this.assertNotQuickProducto(producto, 'eliminación');
    await this.repo.delete(id);
  }

  // src/producto/producto.service.ts
  async findByBarcode(barcode: string): Promise<Producto> {
    const p = await this.repo.findOne({ where: { barcode } });
    if (!p)
      throw new NotFoundException(`No existe producto con barcode ${barcode}`);
    return p;
  }

  async buscarConFiltros(filtros: BuscarProductoDto): Promise<Producto[]> {
    const {
      nombre,
      sku,
      barcode,
      categoriaId,
      unidadId,
      conStock,
      almacenId,
      precioUpdatedDesde,
      precioUpdatedHasta,
      q,
      page,
      limit,
    } = filtros;

    const query = this.repo
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.unidad', 'unidad')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.stock', 'stock')
      .leftJoinAndMapOne('stock.almacen', 'stock.almacen', 'almacen')
      .addSelect('producto.precio_updated_at')
      .where('producto.activo = true')
      // 👇 aseguramos que venga el flag (tu lógica de gramos)
      .addSelect('producto.es_por_gramos')
      .addSelect('producto.proveedorNombre');

    if (nombre) {
      query.andWhere('producto.nombre ILIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    if (sku) {
      query.andWhere('producto.sku = :sku', { sku });
    }

    if (barcode) {
      query.andWhere('producto.barcode = :barcode', { barcode });
    }

    if (categoriaId !== undefined && !isNaN(parseInt(categoriaId))) {
      query.andWhere('producto.categoria_id = :categoriaId', {
        categoriaId: parseInt(categoriaId),
      });
    }

    if (unidadId !== undefined && !isNaN(parseInt(unidadId))) {
      query.andWhere('producto.unidad_id = :unidadId', {
        unidadId: parseInt(unidadId),
      });
    }

    if (almacenId !== undefined && !isNaN(parseInt(almacenId))) {
      query.andWhere('stock.almacen_id = :almacenId', {
        almacenId: parseInt(almacenId),
      });
    }

    if (precioUpdatedDesde) {
      query.andWhere('producto.precio_updated_at >= :precioUpdatedDesde', {
        precioUpdatedDesde,
      });
    }

    if (precioUpdatedHasta) {
      query.andWhere('producto.precio_updated_at <= :precioUpdatedHasta', {
        precioUpdatedHasta,
      });
    }

    if (q) {
      query.andWhere(
        '(producto.nombre ILIKE :q OR producto.sku ILIKE :q OR producto.barcode ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    // 👇 tu filtro original (lo dejamos tal cual)
    const conStockBool = conStock === 'true';
    if (conStockBool) {
      query.andWhere('stock.cantidad > 0');
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (
      Number.isInteger(pageNum) &&
      Number.isInteger(limitNum) &&
      pageNum > 0 &&
      limitNum > 0
    ) {
      query.skip((pageNum - 1) * limitNum).take(Math.min(limitNum, 10000));
    }

    const productos = await query.getMany();

    // === NUEVO: anexar precioFinal sin cambiar el schema ===
    if (productos.length === 0) return productos;

    // Si viene almacenId, buscamos overrides; si no, usamos precioBase como precioFinal
    if (almacenId !== undefined && !isNaN(parseInt(almacenId))) {
      const ids = productos.map((p) => p.id);
      const overrides = await this.ppaRepo.find({
        where: { producto_id: In(ids), almacen_id: Number(almacenId) },
      });

      const mapOverride = new Map<number, number>();
      overrides.forEach((o) =>
        mapOverride.set(o.producto_id, this.getPrecioOverrideEfectivo(o)),
      );

      for (const p of productos) {
        (p as any).precioFinal =
          mapOverride.get(p.id) ?? Number(p.precioBase ?? 0);
      }
    } else {
      for (const p of productos) {
        (p as any).precioFinal = Number(p.precioBase ?? 0);
      }
    }

    return productos;
  }

  async buscarConFiltrosFast(
    filtros: BuscarProductoFastDto,
  ): Promise<Producto[]> {
    const {
      nombre,
      sku,
      barcode,
      categoriaId,
      unidadId,
      conStock,
      almacenId,
      q,
      limit,
    } = filtros;

    const almacenIdNum = Number(almacenId);
    if (!almacenId || !Number.isInteger(almacenIdNum) || almacenIdNum <= 0) {
      return this.buscarConFiltros(filtros);
    }

    const query = this.repo
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.unidad', 'unidad')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .innerJoinAndSelect(
        'producto.stock',
        'stock',
        'stock.almacen_id = :almacenId',
        { almacenId: almacenIdNum },
      )
      .leftJoinAndMapOne('stock.almacen', 'stock.almacen', 'almacen')
      .addSelect('producto.precio_updated_at')
      .where('producto.activo = true')
      .addSelect('producto.es_por_gramos')
      .addSelect('producto.proveedorNombre');

    if (nombre) {
      query.andWhere('producto.nombre ILIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    if (sku) {
      query.andWhere('producto.sku = :sku', { sku });
    }

    if (barcode) {
      query.andWhere('producto.barcode = :barcode', { barcode });
    }

    if (q) {
      query.andWhere(
        '(producto.nombre ILIKE :q OR producto.sku ILIKE :q OR producto.barcode ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (categoriaId !== undefined && !isNaN(parseInt(categoriaId))) {
      query.andWhere('producto.categoria_id = :categoriaId', {
        categoriaId: parseInt(categoriaId),
      });
    }

    if (unidadId !== undefined && !isNaN(parseInt(unidadId))) {
      query.andWhere('producto.unidad_id = :unidadId', {
        unidadId: parseInt(unidadId),
      });
    }

    const conStockBool = conStock === 'true';
    if (conStockBool) {
      query.andWhere('stock.cantidad > 0');
    }

    const limitNum = Number(limit);
    if (Number.isInteger(limitNum) && limitNum > 0) {
      query.take(Math.min(limitNum, 10000));
    }

    const productos = await query.getMany();
    if (productos.length === 0) return productos;

    const ids = productos.map((p) => p.id);
    const overrides = await this.ppaRepo.find({
      where: { producto_id: In(ids), almacen_id: almacenIdNum },
    });

    const mapOverride = new Map<number, number>();
    overrides.forEach((o) =>
      mapOverride.set(o.producto_id, this.getPrecioOverrideEfectivo(o)),
    );

    for (const p of productos) {
      (p as any).precioFinal = mapOverride.get(p.id) ?? Number(p.precioBase ?? 0);
    }

    return productos;
  }

  async borrarLogicamente(id: number): Promise<Producto> {
    const producto = await this.repo.findOne({ where: { id } });
    if (!producto) throw new NotFoundException(`Producto ${id} no encontrado`);
    this.assertNotQuickProducto(producto, 'borrado');
    producto.activo = false;
    return this.repo.save(producto);
  }

  /** Upsert del precio por almacén */
  async upsertPrecioAlmacen(
    input: {
      producto_id: number;
      almacen_id: number;
      precio: number;
      moneda?: string;
      inOferta?: boolean;
      precioOferta?: number;
    },
    user?: { id?: number },
  ) {
    const { producto_id, almacen_id, precio, moneda, inOferta, precioOferta } =
      input;
    if (precio <= 0) throw new BadRequestException('El precio debe ser > 0');

    const ofertaActiva = inOferta === true;
    if (ofertaActiva) {
      if (precioOferta == null || Number(precioOferta) <= 0) {
        throw new BadRequestException(
          'Si inOferta es true, debe enviarse precioOferta > 0',
        );
      }
    }

    // aseguramos que el producto exista (útil para 404 claras)
    const prod = await this.repo.findOne({ where: { id: producto_id } });
    if (!prod)
      throw new NotFoundException(`Producto ${producto_id} no encontrado`);

    const current = await this.ppaRepo.findOne({
      where: { producto_id, almacen_id },
    });

    if (current) {
      const oldVal = Number(current.precio ?? 0);
      const newVal = Number(precio);

      if (oldVal !== newVal) {
        await this.auditPrecio({
          producto_id,
          almacen_id,
          tipo: PrecioHistorialTipo.OVERRIDE,
          precio_anterior: oldVal,
          precio_nuevo: newVal,
          origen: 'POST /productos/precio-override',
          user,
        });
      }


      current.precio = String(precio);
      current.inOferta = ofertaActiva;
      current.precioOferta = ofertaActiva ? String(precioOferta) : null;
      if (moneda) current.moneda = moneda;
      await this.repo.update(producto_id, { precio_updated_at: new Date() });
      return this.ppaRepo.save(current);
    } else {
      const nuevo = this.ppaRepo.create({
        producto_id,
        almacen_id,
        precio: String(precio),
        inOferta: ofertaActiva,
        precioOferta: ofertaActiva ? String(precioOferta) : null,
        moneda: moneda ?? 'ARS',
      });

      await this.auditPrecio({
        producto_id,
        almacen_id,
        tipo: PrecioHistorialTipo.OVERRIDE,
        precio_anterior: null,
        precio_nuevo: Number(precio),
        origen: 'POST /productos/precio-override',
        user,
      });

      await this.repo.update(producto_id, { precio_updated_at: new Date() });
      return this.ppaRepo.save(nuevo);
    }
  }

  /** Elimina el override y vuelve a usar precioBase */
  async removePrecioAlmacen(producto_id: number, almacen_id: number) {
    const res = await this.ppaRepo.delete({ producto_id, almacen_id });
    if (!res.affected) {
      throw new NotFoundException(
        `No existe override para producto ${producto_id} en almacén ${almacen_id}`,
      );
    }
    return { ok: true };
  }

  async updateCargaRapida(dto: UpdateProductoCargaRapidaDto) {
    const producto = await this.repo.findOne({
      where: { barcode: QUICK_BARCODE },
    });
    if (!producto)
      throw new NotFoundException('No existe el producto de carga rápida');

    producto.nombre = dto.nombre;
    producto.descripcion = dto.descripcion;
    producto.precioBase = dto.precioBase;
    if (dto.inOferta !== undefined) {
      producto.inOferta = dto.inOferta;
    }
    producto.precio_updated_at = new Date();

    return this.repo.save(producto);
  }
}
