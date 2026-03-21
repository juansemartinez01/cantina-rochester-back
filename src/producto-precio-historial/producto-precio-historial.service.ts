import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductoPrecioHistorial } from './producto-precio-historial.entity';
import { QueryPrecioHistorialDto } from './dto/query-precio-historial.dto';

@Injectable()
export class ProductoPrecioHistorialService {
  constructor(
    @InjectRepository(ProductoPrecioHistorial)
    private readonly repo: Repository<ProductoPrecioHistorial>,
  ) {}

  async obtenerHistorial(q: QueryPrecioHistorialDto) {
    const page = Number(q.page ?? 1);
    const limit = Math.min(Number(q.limit ?? 50), 200);
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('h')
      .leftJoin('h.producto', 'p')
      .leftJoin('h.almacen', 'a');

    // filtros
    if (q.productoId)
      qb.andWhere('h.producto_id = :productoId', { productoId: q.productoId });
    if (q.almacenId)
      qb.andWhere('h.almacen_id = :almacenId', { almacenId: q.almacenId });
    if (q.tipo) qb.andWhere('h.tipo = :tipo', { tipo: q.tipo });
    if (q.usuarioId)
      qb.andWhere('h.usuario_id = :usuarioId', { usuarioId: q.usuarioId });
    if (q.desde) qb.andWhere('h.created_at >= :desde', { desde: q.desde });
    if (q.hasta) qb.andWhere('h.created_at <= :hasta', { hasta: q.hasta });

    // total (sin paginar)
    const total = await qb.clone().getCount();

    // items (raw + paginado)
    const items = await qb
      .clone()
      .select([
        'h.id as id',
        'h.created_at as fecha',
        'h.tipo as tipo',
        'h.precio_anterior as precioAnterior',
        'h.precio_nuevo as precioNuevo',
        'h.usuario_id as usuarioId',
        'h.usuario_nombre as usuarioNombre',
        'h.origen as origen',
        'p.id as productoId',
        'p.nombre as productoNombre',
        'p.sku as productoSku',
        'a.id as almacenId',
        'a.nombre as almacenNombre',
      ])
      .orderBy('h.created_at', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }
}
