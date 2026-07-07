import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { Gasto, GastoOrigen } from './gasto.entity';
import { GastoCategoria } from './gasto-categoria.entity';
import { Almacen } from 'src/almacen/almacen.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { FiltroGastoDto } from './dto/filtro-gasto.dto';
import { CreateGastoCategoriaDto } from './dto/create-gasto-categoria.dto';
import { UpdateGastoCategoriaDto } from './dto/update-gasto-categoria.dto';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly repo: Repository<Gasto>,
    @InjectRepository(GastoCategoria)
    private readonly categoriaRepo: Repository<GastoCategoria>,
    @InjectRepository(Almacen)
    private readonly almacenRepo: Repository<Almacen>,
  ) {}

  async crear(dto: CreateGastoDto): Promise<Gasto> {
    const categoria = dto.categoriaId
      ? await this.obtenerCategoriaActiva(dto.categoriaId)
      : null;
    const almacen = dto.almacenId
      ? await this.obtenerAlmacen(dto.almacenId)
      : null;
    const montoFix2 = Number(dto.monto.toFixed(2));
    const entity = this.repo.create({
      fecha: dto.fecha,
      monto: montoFix2.toFixed(2),
      descripcion: this.cleanRequired(dto.descripcion, 'descripcion'),
      notas: this.clean(dto.notas) ?? null,
      categoriaId: categoria?.id ?? null,
      categoria,
      almacenId: almacen?.id ?? null,
      almacen,
      origen: GastoOrigen.MANUAL,
      ordenCompraId: null,
    });

    const guardado = await this.repo.save(entity);
    return this.obtenerPorId(guardado.id);
  }

  async actualizar(id: number, dto: UpdateGastoDto): Promise<Gasto> {
    const gasto = await this.repo.findOne({
      where: { id },
      relations: ['categoria', 'almacen'],
    });
    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    if (dto.monto !== undefined) {
      if (dto.monto <= 0) throw new BadRequestException('monto debe ser > 0');
      gasto.monto = Number(dto.monto.toFixed(2)).toFixed(2);
    }
    if (dto.fecha !== undefined) gasto.fecha = dto.fecha;
    if (dto.descripcion !== undefined) {
      gasto.descripcion = this.cleanRequired(dto.descripcion, 'descripcion');
    }
    if (dto.notas !== undefined) gasto.notas = this.clean(dto.notas) ?? null;
    if (dto.categoriaId !== undefined) {
      const categoria = dto.categoriaId
        ? await this.obtenerCategoriaActiva(dto.categoriaId)
        : null;
      gasto.categoriaId = categoria?.id ?? null;
      gasto.categoria = categoria;
    }
    if (dto.almacenId !== undefined) {
      const almacen = dto.almacenId
        ? await this.obtenerAlmacen(dto.almacenId)
        : null;
      gasto.almacenId = almacen?.id ?? null;
      gasto.almacen = almacen;
    }

    await this.repo.save(gasto);
    return this.obtenerPorId(id);
  }

  async obtenerPorId(id: number, incluirEliminados = false): Promise<Gasto> {
    const where: FindOptionsWhere<Gasto> = { id };
    const gasto = await this.repo.findOne({
      where,
      relations: ['categoria', 'almacen'],
      withDeleted: incluirEliminados,
    });
    if (!gasto) throw new NotFoundException('Gasto no encontrado');
    return gasto;
  }

  async listar(f: FiltroGastoDto): Promise<{
    data: Gasto[];
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    totalMontoFiltrado: string;
  }> {
    const {
      desde,
      hasta,
      search,
      q,
      categoria,
      categoriaId,
      almacenId,
      minMonto,
      maxMonto,
      origen,
      ordenCompraId,
      page = 1,
      limit = 20,
      orderBy = 'fecha',
      order = 'DESC',
      incluirEliminados,
    } = f;

    if (desde && hasta && new Date(desde) > new Date(hasta)) {
      throw new BadRequestException('El rango de fechas es invalido: desde > hasta');
    }
    if (minMonto && maxMonto && minMonto > maxMonto) {
      throw new BadRequestException('El rango de monto es invalido: minMonto > maxMonto');
    }

    const textoBusqueda = this.clean(q ?? search);
    const categoriaFiltro = this.clean(categoria);

    const qb = this.repo
      .createQueryBuilder('g')
      .leftJoin('g.categoria', 'categoria')
      .leftJoin('g.almacen', 'almacen')
      .select([
        'g.id',
        'g.fecha',
        'g.monto',
        'g.descripcion',
        'g.notas',
        'g.categoriaId',
        'g.almacenId',
        'g.origen',
        'g.ordenCompraId',
        'g.createdAt',
        'g.updatedAt',
        'g.deletedAt',
        'categoria.id',
        'categoria.nombre',
        'categoria.descripcion',
        'categoria.activo',
        'almacen.id',
        'almacen.nombre',
        'almacen.ubicacion',
      ]);

    if (incluirEliminados === 'true') {
      qb.withDeleted();
    } else {
      qb.andWhere('g.deletedAt IS NULL');
    }

    this.aplicarFiltrosGastos(qb, {
      desde,
      hasta,
      textoBusqueda,
      categoria: categoriaFiltro,
      categoriaId,
      almacenId,
      origen,
      ordenCompraId,
      minMonto,
      maxMonto,
    });

    const orderMap: Record<string, string> = {
      fecha: 'g.fecha',
      monto: 'g.monto',
      createdAt: 'g.createdAt',
      categoria: 'categoria.nombre',
    };
    qb.orderBy(orderMap[orderBy], order);

    qb.skip((page - 1) * limit).take(limit);

    const [data, totalItems] = await qb.getManyAndCount();

    const sumQb = this.repo
      .createQueryBuilder('g')
      .leftJoin('g.categoria', 'categoria')
      .leftJoin('g.almacen', 'almacen')
      .select('COALESCE(SUM(g.monto), 0)', 'total');
    if (incluirEliminados === 'true') {
      sumQb.withDeleted();
    } else {
      sumQb.andWhere('g.deletedAt IS NULL');
    }

    this.aplicarFiltrosGastos(sumQb, {
      desde,
      hasta,
      textoBusqueda,
      categoria: categoriaFiltro,
      categoriaId,
      almacenId,
      origen,
      ordenCompraId,
      minMonto,
      maxMonto,
    });

    const row = await sumQb.getRawOne<{ total: string } | null>();
    const totalMontoFiltrado = row?.total ?? '0';

    return {
      data,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      totalMontoFiltrado: totalMontoFiltrado ?? '0',
    };
  }

  async listarCategorias(
    activo: 'true' | 'false' | 'all' = 'true',
  ): Promise<GastoCategoria[]> {
    const qb = this.categoriaRepo
      .createQueryBuilder('categoria')
      .orderBy('LOWER(categoria.nombre)', 'ASC');

    if (activo !== 'all') {
      qb.where('categoria.activo = :activo', { activo: activo !== 'false' });
    }

    return qb.getMany();
  }

  async crearCategoria(dto: CreateGastoCategoriaDto): Promise<GastoCategoria> {
    const nombre = this.cleanRequired(dto.nombre, 'nombre');
    await this.assertNombreCategoriaDisponible(nombre);

    const categoria = this.categoriaRepo.create({
      nombre,
      descripcion: this.clean(dto.descripcion) ?? null,
      activo: true,
    });

    return this.categoriaRepo.save(categoria);
  }

  async actualizarCategoria(
    id: number,
    dto: UpdateGastoCategoriaDto,
  ): Promise<GastoCategoria> {
    const categoria = await this.obtenerCategoria(id);

    if (dto.nombre !== undefined) {
      const nombre = this.cleanRequired(dto.nombre, 'nombre');
      if (nombre.toLowerCase() !== categoria.nombre.toLowerCase()) {
        await this.assertNombreCategoriaDisponible(nombre, id);
      }
      categoria.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      categoria.descripcion = this.clean(dto.descripcion) ?? null;
    }

    if (dto.activo !== undefined) {
      categoria.activo = dto.activo;
    }

    return this.categoriaRepo.save(categoria);
  }

  async activarCategoria(id: number): Promise<GastoCategoria> {
    const categoria = await this.obtenerCategoria(id);
    categoria.activo = true;
    return this.categoriaRepo.save(categoria);
  }

  async desactivarCategoria(id: number): Promise<GastoCategoria> {
    const categoria = await this.obtenerCategoria(id);
    categoria.activo = false;
    return this.categoriaRepo.save(categoria);
  }

  async eliminar(id: number): Promise<void> {
    const gasto = await this.repo.findOne({ where: { id } });
    if (!gasto) throw new NotFoundException('Gasto no encontrado');
    await this.repo.softRemove(gasto);
  }

  async eliminarDefinitivo(id: number): Promise<void> {
    const gasto = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!gasto) throw new NotFoundException('Gasto no encontrado');
    await this.repo.remove(gasto);
  }

  private aplicarFiltrosGastos(
    qb: SelectQueryBuilder<Gasto>,
    filtros: {
      desde?: string;
      hasta?: string;
      textoBusqueda?: string | null;
      categoria?: string | null;
      categoriaId?: number;
      almacenId?: number;
      origen?: GastoOrigen;
      ordenCompraId?: number;
      minMonto?: number;
      maxMonto?: number;
    },
  ) {
    const {
      desde,
      hasta,
      textoBusqueda,
      categoria,
      categoriaId,
      almacenId,
      origen,
      ordenCompraId,
      minMonto,
      maxMonto,
    } = filtros;

    if (desde && hasta) {
      qb.andWhere('g.fecha BETWEEN :desde AND :hasta', { desde, hasta });
    } else if (desde) {
      qb.andWhere('g.fecha >= :desde', { desde });
    } else if (hasta) {
      qb.andWhere('g.fecha <= :hasta', { hasta });
    }

    if (textoBusqueda) {
      qb.andWhere(
        '(g.descripcion ILIKE :textoBusqueda OR g.notas ILIKE :textoBusqueda OR categoria.nombre ILIKE :textoBusqueda)',
        { textoBusqueda: `%${textoBusqueda}%` },
      );
    }

    if (categoriaId) {
      qb.andWhere('g.categoriaId = :categoriaId', { categoriaId });
    }

    if (categoria) {
      const categoriaComoId = Number(categoria);
      if (Number.isInteger(categoriaComoId) && categoriaComoId > 0) {
        qb.andWhere('g.categoriaId = :categoriaComoId', { categoriaComoId });
      } else {
        qb.andWhere('LOWER(categoria.nombre) = LOWER(:categoriaNombre)', {
          categoriaNombre: categoria,
        });
      }
    }

    if (almacenId) {
      qb.andWhere('g.almacenId = :almacenId', { almacenId });
    }

    if (origen) {
      qb.andWhere('g.origen = :origen', { origen });
    }
    if (ordenCompraId) {
      qb.andWhere('g.ordenCompraId = :ordenCompraId', { ordenCompraId });
    }

    if (minMonto !== undefined) {
      qb.andWhere('g.monto >= :minMonto', { minMonto });
    }
    if (maxMonto !== undefined) {
      qb.andWhere('g.monto <= :maxMonto', { maxMonto });
    }
  }

  private async obtenerCategoria(id: number): Promise<GastoCategoria> {
    const categoria = await this.categoriaRepo.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoria de gasto no encontrada');
    return categoria;
  }

  private async obtenerCategoriaActiva(id: number): Promise<GastoCategoria> {
    const categoria = await this.obtenerCategoria(id);
    if (!categoria.activo) {
      throw new BadRequestException('La categoria de gasto esta inactiva');
    }
    return categoria;
  }

  private async obtenerAlmacen(id: number): Promise<Almacen> {
    const almacen = await this.almacenRepo.findOne({ where: { id } });
    if (!almacen) throw new NotFoundException('Almacen no encontrado');
    return almacen;
  }

  private async assertNombreCategoriaDisponible(
    nombre: string,
    excluirId?: number,
  ): Promise<void> {
    const existente = await this.categoriaRepo
      .createQueryBuilder('categoria')
      .where('LOWER(categoria.nombre) = LOWER(:nombre)', { nombre })
      .getOne();

    if (existente && existente.id !== excluirId) {
      throw new BadRequestException(`La categoria de gasto "${nombre}" ya existe`);
    }
  }

  private clean(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    const cleaned = value?.trim();
    return cleaned || null;
  }

  private cleanRequired(value: string | undefined | null, field: string): string {
    const cleaned = value?.trim();
    if (!cleaned) {
      throw new BadRequestException(`${field} es obligatorio`);
    }
    return cleaned;
  }
}
