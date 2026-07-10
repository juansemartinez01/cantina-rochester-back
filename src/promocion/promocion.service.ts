import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Promocion } from './promocion.entity';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { PromocionProducto } from './promocion-producto.entity';
import { UpdatePromocionDto } from './dto/update-promocion.dto';
import { Producto } from 'src/producto/producto.entity';
import { QueryProductosPromocionActivaDto } from './dto/query-productos-promocion-activa.dto';
import { Almacen } from 'src/almacen/almacen.entity';
import { QueryPromocionDto } from './dto/query-promocion.dto';

type PromocionListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type PromocionListResponse = {
  data: Promocion[];
  meta: PromocionListMeta;
};

@Injectable()
export class PromocionService {
  constructor(
    @InjectRepository(Promocion)
    private readonly promoRepo: Repository<Promocion>,

    @InjectRepository(PromocionProducto)
    private readonly promoProdRepo: Repository<PromocionProducto>,

    @InjectRepository(Producto) private readonly prodRepo: Repository<Producto>,
    @InjectRepository(Almacen)
    private readonly almacenRepo: Repository<Almacen>,
  ) {}

  async create(dto: CreatePromocionDto): Promise<Promocion> {
    const almacen = dto.almacenId
      ? await this.obtenerAlmacen(dto.almacenId)
      : null;
    const existente = await this.promoRepo.findOne({
      where: { codigo: dto.codigo },
      relations: ['productos', 'productos.producto'],
    });
    if (existente) {
      if (existente.activo) {
        const productos = existente.productos.map((p) => ({
          id: p.producto.id,
          nombre: p.producto.nombre,
          cantidad: p.cantidad,
          cantidad_gramos: p.cantidad_gramos,
        }));
        throw new ConflictException({
          mensaje: `Ya existe una promoción ACTIVA con el código "${dto.codigo}"`,
          productos,
        });
      } else {
        throw new ConflictException(
          `El código "${dto.codigo}" pertenece a una promoción INACTIVA. Por favor use otro código.`,
        );
      }
    }

    const productosProcesados: PromocionProducto[] = [];
    for (const p of dto.productos) {
      const prod = await this.prodRepo.findOne({ where: { id: p.productoId } });
      if (!prod)
        throw new NotFoundException(`Producto ${p.productoId} no encontrado`);

      const esPorGramos = !!prod.es_por_gramos;
      const traePiezas = p.cantidad != null;
      const traeGramos = p.cantidad_gramos != null;

      if (esPorGramos) {
        if (!traeGramos || traePiezas) {
          throw new BadRequestException(
            `El producto ${prod.nombre} se maneja por gramos: usar 'cantidad_gramos' (y no 'cantidad').`,
          );
        }
      } else {
        if (!traePiezas || traeGramos) {
          throw new BadRequestException(
            `El producto ${prod.nombre} se maneja por piezas: usar 'cantidad' (y no 'cantidad_gramos').`,
          );
        }
      }

      const pp = new PromocionProducto();
      pp.producto = prod;
      pp.cantidad = esPorGramos ? null : p.cantidad!;
      pp.cantidad_gramos = esPorGramos ? p.cantidad_gramos!.toFixed(3) : null;

      productosProcesados.push(pp);
    }

    const promocion = this.promoRepo.create({
      codigo: dto.codigo,
      precioPromo: dto.precioPromo,
      almacenId: almacen?.id ?? null,
      almacen,
      productos: productosProcesados,
    });

    return this.promoRepo.save(promocion);
  }

  async findAll(query: QueryPromocionDto): Promise<PromocionListResponse> {
    const page = this.normalizePositiveInt(query.page, 1);
    const limit = this.normalizePositiveInt(query.limit, 50, 200);
    const almacenId = this.normalizeOptionalId(query.almacenId);

    const qb = this.promoRepo
      .createQueryBuilder('promocion')
      .leftJoinAndSelect('promocion.almacen', 'almacen')
      .leftJoinAndSelect('promocion.productos', 'productos')
      .leftJoinAndSelect('productos.producto', 'producto')
      .orderBy('promocion.id', 'DESC');

    this.aplicarFiltroAlmacenPromocion(qb, almacenId);

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  async findOne(id: number): Promise<Promocion> {
    const promocion = await this.promoRepo.findOne({
      where: { id },
      relations: ['almacen', 'productos', 'productos.producto'],
    });
    if (!promocion) {
      throw new Error(`Promocion with id ${id} not found`);
    }
    return promocion;
  }

  async remove(id: number): Promise<void> {
    await this.promoRepo.delete(id);
  }

  async findByCodigo(codigo: string, almacenId?: number): Promise<Promocion> {
    const promocion = await this.promoRepo.findOne({
      where: { codigo },
      relations: ['almacen', 'productos', 'productos.producto'],
    });

    if (!promocion) {
      throw new NotFoundException(
        `No se encontró ninguna promoción con el código "${codigo}"`,
      );
    }

    this.validarPromocionDisponibleEnAlmacen(promocion, almacenId);

    return promocion;
  }

  async getPromocionById(id: number): Promise<Promocion> {
    const promocion = await this.promoRepo.findOne({
      where: { id },
      relations: ['almacen', 'productos', 'productos.producto'],
    });

    if (!promocion) {
      throw new NotFoundException(
        `No se encontró ninguna promoción con el id "${id}"`,
      );
    }

    return promocion;
  }

  async update(id: number, dto: UpdatePromocionDto): Promise<Promocion> {
    const promocion = await this.promoRepo.findOne({
      where: { id },
      relations: ['almacen', 'productos'],
    });
    if (!promocion)
      throw new NotFoundException(`Promoción con id ${id} no encontrada`);

    if (dto.codigo !== undefined) promocion.codigo = dto.codigo;
    if (dto.precioPromo !== undefined) promocion.precioPromo = dto.precioPromo;
    if (dto.almacenId !== undefined) {
      const almacen = dto.almacenId
        ? await this.obtenerAlmacen(dto.almacenId)
        : null;
      promocion.almacenId = almacen?.id ?? null;
      promocion.almacen = almacen;
    }

    // reemplazar productos si vienen
    if (dto.productos) {
      await this.promoProdRepo.delete({ promocion: { id } });

      const nuevos: PromocionProducto[] = [];
      for (const p of dto.productos) {
        const prod = await this.prodRepo.findOne({
          where: { id: p.productoId },
        });
        if (!prod)
          throw new NotFoundException(`Producto ${p.productoId} no encontrado`);

        const esPorGramos = !!prod.es_por_gramos;
        const traePiezas = p.cantidad != null;
        const traeGramos = p.cantidad_gramos != null;

        if (esPorGramos) {
          if (!traeGramos || traePiezas) {
            throw new BadRequestException(
              `El producto ${prod.nombre} se maneja por gramos: usar 'cantidad_gramos' (y no 'cantidad').`,
            );
          }
        } else {
          if (!traePiezas || traeGramos) {
            throw new BadRequestException(
              `El producto ${prod.nombre} se maneja por piezas: usar 'cantidad' (y no 'cantidad_gramos').`,
            );
          }
        }

        const pp = new PromocionProducto();
        pp.producto = prod;
        pp.cantidad = esPorGramos ? null : p.cantidad!;
        pp.cantidad_gramos = esPorGramos ? p.cantidad_gramos!.toFixed(3) : null;
        nuevos.push(pp);
      }
      promocion.productos = nuevos;
    }

    return this.promoRepo.save(promocion);
  }

  async findActivas(almacenId?: number): Promise<Promocion[]> {
    const qb = this.promoRepo
      .createQueryBuilder('promocion')
      .leftJoinAndSelect('promocion.almacen', 'almacen')
      .leftJoinAndSelect('promocion.productos', 'productos')
      .leftJoinAndSelect('productos.producto', 'producto')
      .where('promocion.activo = :activo', { activo: true })
      .orderBy('promocion.id', 'DESC');

    this.aplicarFiltroAlmacenPromocion(qb, almacenId);

    return qb.getMany();
  }

  async findProductosEnPromocionesActivas(
    query: QueryProductosPromocionActivaDto,
  ) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 50), 200);
    const skip = (page - 1) * limit;

    const qb = this.promoProdRepo
      .createQueryBuilder('pp')
      .innerJoinAndSelect(
        'pp.promocion',
        'promocion',
        'promocion.activo = :activo',
        {
          activo: true,
        },
      )
      .innerJoinAndSelect('pp.producto', 'producto')
      .orderBy('promocion.id', 'DESC')
      .addOrderBy('pp.id', 'DESC');

    this.aplicarFiltroAlmacenPromocion(qb, query.almacenId, 'promocion');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    };
  }

  private async setActivo(
    id: number,
    activo: boolean,
  ): Promise<{ message: string }> {
    const promocion = await this.promoRepo.findOne({ where: { id } });
    if (!promocion) {
      throw new NotFoundException(
        `No se encontró ninguna promoción con id ${id}`,
      );
    }

    promocion.activo = activo;
    await this.promoRepo.save(promocion);

    return {
      message: activo
        ? `Promoción con id ${id} activada correctamente`
        : `Promoción con id ${id} desactivada correctamente`,
    };
  }

  async activar(id: number): Promise<{ message: string }> {
    return this.setActivo(id, true);
  }

  async desactivar(id: number): Promise<{ message: string }> {
    return this.setActivo(id, false);
  }

  async borrarLogicamente(id: number): Promise<{ message: string }> {
    return this.desactivar(id);
  }

  private async obtenerAlmacen(id: number): Promise<Almacen> {
    const almacen = await this.almacenRepo.findOne({ where: { id } });
    if (!almacen) {
      throw new NotFoundException(`Almacen ${id} no encontrado`);
    }
    return almacen;
  }

  private aplicarFiltroAlmacenPromocion(
    qb: SelectQueryBuilder<any>,
    almacenId?: number,
    alias = 'promocion',
  ): void {
    if (!almacenId) return;
    qb.andWhere(
      `(${alias}.almacen_id = :almacenId OR ${alias}.almacen_id IS NULL)`,
      {
        almacenId,
      },
    );
  }

  private normalizePositiveInt(
    value: number | string | undefined,
    defaultValue: number,
    max?: number,
  ): number {
    const parsed = value === undefined ? defaultValue : Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        'page y limit deben ser enteros mayores a 0',
      );
    }
    return max === undefined ? parsed : Math.min(parsed, max);
  }

  private normalizeOptionalId(
    value: number | string | undefined | null,
  ): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private validarPromocionDisponibleEnAlmacen(
    promocion: Promocion,
    almacenId?: number,
  ): void {
    if (!almacenId || promocion.almacenId == null) return;
    if (Number(promocion.almacenId) !== Number(almacenId)) {
      throw new NotFoundException(
        `No se encontro ninguna promocion disponible para el almacen ${almacenId}`,
      );
    }
  }
}
