import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Producto } from './producto.entity';
import { Unidad } from 'src/unidad/unidad.entity';
import { Categoria } from 'src/categoria/categoria.entity';
import { Almacen } from 'src/almacen/almacen.entity';
import { StockActual } from 'src/stock-actual/stock-actual.entity';
import { ProductoPrecioAlmacen } from 'src/producto-precio-almacen/producto-precio-almacen.entity';
import {
  PrecioHistorialTipo,
  ProductoPrecioHistorial,
} from 'src/producto-precio-historial/producto-precio-historial.entity';
import { Usuario } from 'src/usuario/usuario.entity';

const QUICK_BARCODE = '000000000000';
const ORIGEN_IMPORT = 'POST /productos/importar';

const COLUMNAS = [
  'sku',
  'barcode',
  'nombre',
  'descripcion',
  'categoria',
  'unidad',
  'es_por_gramos',
  'proveedor',
  'activo',
  'precio_base',
  'precio_almacen1',
  'en_oferta',
  'precio_oferta',
  'stock_unidades',
  'stock_gramos',
] as const;

type ColumnaExcel = (typeof COLUMNAS)[number];

type FilaImport = {
  fila: number;
  sku: string;
  barcode: string | null;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad: string | null;
  es_por_gramos: boolean | null;
  proveedor: string | null;
  activo: boolean;
  precio_base: number;
  precio_almacen1: number | null;
  en_oferta: boolean;
  precio_oferta: number | null;
  stock_unidades: number | null;
  stock_gramos: number | null;
};

type AuthUser = { id?: number };

export type ResultadoImportacion = {
  almacenId: number;
  productosCreados: number;
  productosActualizados: number;
  productosEliminados: { cantidad: number; skus: string[] };
  categoriasCreadas: string[];
  preciosAlmacenActualizados: number;
  stockActualizado: number;
  advertencias: string[];
};

@Injectable()
export class ProductoImportacionService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async importarDesdeExcel(
    buffer: Buffer,
    almacenId: number,
    user?: AuthUser,
  ): Promise<ResultadoImportacion> {
    const filas = await this.parsearExcel(buffer);
    if (!filas.length) {
      throw new BadRequestException(
        'La hoja "Productos" no contiene filas de datos.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const almacen = await manager.getRepository(Almacen).findOne({
        where: { id: almacenId },
        select: ['id'],
      });
      if (!almacen) {
        throw new NotFoundException(`Almacen ${almacenId} no encontrado`);
      }

      const auditoria = await this.resolveUserForAudit(manager, user);
      const advertencias: string[] = [];

      const unidadPorNombre = await this.cargarUnidades(manager);
      const { categoriaPorNombre, categoriasCreadas } =
        await this.resolverCategorias(manager, filas);

      const productosExistentes = await manager.getRepository(Producto).find();
      const existentePorSku = new Map(
        productosExistentes.map((p) => [p.sku.toLowerCase(), p]),
      );

      // ── 1) Eliminación definitiva de productos que no están en el Excel ──
      const skusExcel = new Set(filas.map((f) => f.sku.toLowerCase()));
      const aEliminar = productosExistentes.filter(
        (p) => !skusExcel.has(p.sku.toLowerCase()),
      );
      const eliminados: string[] = [];
      const idsEliminar: number[] = [];
      for (const p of aEliminar) {
        if (p.barcode === QUICK_BARCODE) {
          advertencias.push(
            `El producto de carga rápida (SKU ${p.sku}) no figura en el Excel pero no se elimina porque es requerido por el sistema.`,
          );
          continue;
        }
        idsEliminar.push(p.id);
        eliminados.push(p.sku);
      }
      if (idsEliminar.length) {
        await this.eliminarProductosConHistorial(manager, idsEliminar);
      }

      // ── 2) Upsert de productos por SKU ──
      let creados = 0;
      let actualizados = 0;
      const productoIdPorSku = new Map<string, Producto>();

      for (const fila of filas) {
        const unidad = this.resolverUnidad(unidadPorNombre, fila);
        const esPorGramos =
          fila.es_por_gramos ?? this.esGramos(unidad ?? undefined);
        const categoriaId = fila.categoria
          ? (categoriaPorNombre.get(fila.categoria.toLowerCase())?.id ?? null)
          : null;

        const existente = existentePorSku.get(fila.sku.toLowerCase());
        if (existente) {
          const precioAnterior = Number(existente.precioBase ?? 0);
          const cambiaPrecio = precioAnterior !== fila.precio_base;

          await manager.getRepository(Producto).update(
            { id: existente.id },
            {
              nombre: fila.nombre,
              descripcion: fila.descripcion ?? undefined,
              barcode: fila.barcode ?? undefined,
              unidad_id: unidad.id,
              categoria_id: categoriaId ?? undefined,
              proveedorNombre: fila.proveedor ?? undefined,
              activo: fila.activo,
              es_por_gramos: esPorGramos,
              precioBase: fila.precio_base,
              ...(cambiaPrecio ? { precio_updated_at: new Date() } : {}),
            },
          );

          if (cambiaPrecio) {
            await this.auditPrecio(manager, {
              producto_id: existente.id,
              almacen_id: null,
              tipo: PrecioHistorialTipo.BASE,
              precio_anterior: precioAnterior,
              precio_nuevo: fila.precio_base,
              ...auditoria,
            });
          }
          productoIdPorSku.set(fila.sku.toLowerCase(), existente);
          actualizados++;
        } else {
          const nuevo = await manager.getRepository(Producto).save(
            manager.getRepository(Producto).create({
              sku: fila.sku,
              nombre: fila.nombre,
              descripcion: fila.descripcion ?? undefined,
              barcode: fila.barcode ?? undefined,
              unidad_id: unidad.id,
              categoria_id: categoriaId ?? undefined,
              proveedorNombre: fila.proveedor ?? undefined,
              activo: fila.activo,
              es_por_gramos: esPorGramos,
              precioBase: fila.precio_base,
              precio_updated_at: new Date(),
            }),
          );
          await this.auditPrecio(manager, {
            producto_id: nuevo.id,
            almacen_id: null,
            tipo: PrecioHistorialTipo.BASE,
            precio_anterior: null,
            precio_nuevo: fila.precio_base,
            ...auditoria,
          });
          productoIdPorSku.set(fila.sku.toLowerCase(), nuevo);
          creados++;
        }
      }

      // ── 3) Precio por almacén (override) ──
      let preciosActualizados = 0;
      const ppaRepo = manager.getRepository(ProductoPrecioAlmacen);
      for (const fila of filas) {
        const producto = productoIdPorSku.get(fila.sku.toLowerCase());
        if (!producto) continue;

        const actual = await ppaRepo.findOne({
          where: { producto_id: producto.id, almacen_id: almacenId },
        });

        if (fila.precio_almacen1 == null) {
          if (actual) {
            await ppaRepo.delete({
              producto_id: producto.id,
              almacen_id: almacenId,
            });
            await this.auditPrecio(manager, {
              producto_id: producto.id,
              almacen_id: almacenId,
              tipo: PrecioHistorialTipo.OVERRIDE_REMOVED,
              precio_anterior: Number(actual.precio ?? 0),
              precio_nuevo: null,
              ...auditoria,
            });
            preciosActualizados++;
          }
          continue;
        }

        if (actual) {
          const precioAnterior = Number(actual.precio ?? 0);
          if (precioAnterior !== fila.precio_almacen1) {
            await this.auditPrecio(manager, {
              producto_id: producto.id,
              almacen_id: almacenId,
              tipo: PrecioHistorialTipo.OVERRIDE,
              precio_anterior: precioAnterior,
              precio_nuevo: fila.precio_almacen1,
              ...auditoria,
            });
          }
          actual.precio = String(fila.precio_almacen1);
          actual.inOferta = fila.en_oferta;
          actual.precioOferta = fila.en_oferta
            ? String(fila.precio_oferta)
            : null;
          await ppaRepo.save(actual);
        } else {
          await this.auditPrecio(manager, {
            producto_id: producto.id,
            almacen_id: almacenId,
            tipo: PrecioHistorialTipo.OVERRIDE,
            precio_anterior: null,
            precio_nuevo: fila.precio_almacen1,
            ...auditoria,
          });
          await ppaRepo.save(
            ppaRepo.create({
              producto_id: producto.id,
              almacen_id: almacenId,
              precio: String(fila.precio_almacen1),
              inOferta: fila.en_oferta,
              precioOferta: fila.en_oferta
                ? String(fila.precio_oferta)
                : null,
              moneda: 'ARS',
            }),
          );
        }
        preciosActualizados++;
      }

      // ── 4) Stock del almacén (pisa el valor actual) ──
      let stockActualizado = 0;
      for (const fila of filas) {
        const producto = productoIdPorSku.get(fila.sku.toLowerCase());
        if (!producto) continue;

        const esPorGramos =
          fila.es_por_gramos ??
          this.esGramos(this.resolverUnidad(unidadPorNombre, fila));
        const cantidad = fila.stock_unidades ?? 0;
        const cantidadGramos = esPorGramos
          ? (fila.stock_gramos ?? 0).toFixed(3)
          : null;

        await manager
          .createQueryBuilder()
          .insert()
          .into(StockActual)
          .values({
            producto_id: producto.id,
            almacen_id: almacenId,
            cantidad,
            cantidad_gramos: cantidadGramos,
          })
          .orUpdate(
            ['cantidad', 'cantidad_gramos', 'last_updated'],
            ['producto_id', 'almacen_id'],
          )
          .execute();
        stockActualizado++;
      }

      return {
        almacenId,
        productosCreados: creados,
        productosActualizados: actualizados,
        productosEliminados: {
          cantidad: eliminados.length,
          skus: eliminados,
        },
        categoriasCreadas,
        preciosAlmacenActualizados: preciosActualizados,
        stockActualizado,
        advertencias,
      };
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // Parseo y validación del Excel
  // ────────────────────────────────────────────────────────────────────

  private async parsearExcel(buffer: Buffer): Promise<FilaImport[]> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException(
        'El archivo no es un Excel (.xlsx) válido.',
      );
    }

    const hoja =
      workbook.getWorksheet('Productos') ?? workbook.worksheets[0];
    if (!hoja) {
      throw new BadRequestException('El archivo no contiene hojas.');
    }

    const headerRow = hoja.getRow(1);
    const colPorNombre = new Map<ColumnaExcel, number>();
    headerRow.eachCell((cell, colNumber) => {
      const nombre = this.cellToString(cell.value)?.toLowerCase().trim();
      if (nombre && (COLUMNAS as readonly string[]).includes(nombre)) {
        colPorNombre.set(nombre as ColumnaExcel, colNumber);
      }
    });

    const obligatorias: ColumnaExcel[] = ['sku', 'nombre', 'precio_base'];
    const faltantes = obligatorias.filter((c) => !colPorNombre.has(c));
    if (faltantes.length) {
      throw new BadRequestException(
        `Faltan columnas obligatorias en la hoja "Productos": ${faltantes.join(', ')}`,
      );
    }

    const errores: string[] = [];
    const filas: FilaImport[] = [];
    const skusVistos = new Map<string, number>();
    const barcodesVistos = new Map<string, number>();

    hoja.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const leer = (col: ColumnaExcel) => {
        const idx = colPorNombre.get(col);
        return idx ? row.getCell(idx).value : null;
      };

      const sku = this.cellToString(leer('sku'));
      const nombre = this.cellToString(leer('nombre'));
      const esFilaVacia =
        !sku &&
        !nombre &&
        !this.cellToString(leer('barcode')) &&
        this.cellToNumber(leer('precio_base')) == null;
      if (esFilaVacia) return;

      if (!sku) {
        errores.push(`Fila ${rowNumber}: falta el SKU.`);
        return;
      }
      if (!nombre) {
        errores.push(`Fila ${rowNumber}: falta el nombre.`);
        return;
      }

      const skuKey = sku.toLowerCase();
      if (skusVistos.has(skuKey)) {
        errores.push(
          `Fila ${rowNumber}: SKU "${sku}" duplicado (ya aparece en la fila ${skusVistos.get(skuKey)}).`,
        );
        return;
      }
      skusVistos.set(skuKey, rowNumber);

      const barcode = this.cellToString(leer('barcode'));
      if (barcode) {
        const bcKey = barcode.toLowerCase();
        if (barcodesVistos.has(bcKey)) {
          errores.push(
            `Fila ${rowNumber}: barcode "${barcode}" duplicado (ya aparece en la fila ${barcodesVistos.get(bcKey)}).`,
          );
          return;
        }
        barcodesVistos.set(bcKey, rowNumber);
      }

      const precioBase = this.cellToNumber(leer('precio_base'));
      if (precioBase == null || precioBase < 0) {
        errores.push(
          `Fila ${rowNumber} (${sku}): precio_base inválido o vacío.`,
        );
        return;
      }

      const enOferta = this.siNo(leer('en_oferta')) ?? false;
      const precioOferta = this.cellToNumber(leer('precio_oferta'));
      if (enOferta && (precioOferta == null || precioOferta <= 0)) {
        errores.push(
          `Fila ${rowNumber} (${sku}): en_oferta es SI pero falta precio_oferta > 0.`,
        );
        return;
      }

      const precioAlmacen = this.cellToNumber(leer('precio_almacen1'));
      if (precioAlmacen != null && precioAlmacen <= 0) {
        errores.push(
          `Fila ${rowNumber} (${sku}): precio_almacen1 debe ser mayor a 0 (o quedar vacío para usar el precio base).`,
        );
        return;
      }
      if (enOferta && precioAlmacen == null) {
        errores.push(
          `Fila ${rowNumber} (${sku}): para marcar en_oferta debe indicarse precio_almacen1.`,
        );
        return;
      }

      filas.push({
        fila: rowNumber,
        sku,
        barcode: barcode ?? null,
        nombre,
        descripcion: this.cellToString(leer('descripcion')) ?? null,
        categoria: this.cellToString(leer('categoria')) ?? null,
        unidad: this.cellToString(leer('unidad')) ?? null,
        es_por_gramos: this.siNo(leer('es_por_gramos')),
        proveedor: this.cellToString(leer('proveedor')) ?? null,
        activo: this.siNo(leer('activo')) ?? true,
        precio_base: precioBase,
        precio_almacen1: precioAlmacen,
        en_oferta: enOferta,
        precio_oferta: precioOferta,
        stock_unidades: this.cellToNumber(leer('stock_unidades')),
        stock_gramos: this.cellToNumber(leer('stock_gramos')),
      });
    });

    if (errores.length) {
      throw new BadRequestException({
        message: 'El Excel tiene errores de validación. No se importó nada.',
        errores,
      });
    }

    return filas;
  }

  private cellToString(value: ExcelJS.CellValue): string | null {
    if (value == null) return null;
    if (typeof value === 'string') {
      const t = value.trim();
      return t === '' ? null : t;
    }
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'SI' : 'NO';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      if ('richText' in value) {
        const t = value.richText.map((r) => r.text).join('').trim();
        return t === '' ? null : t;
      }
      if ('text' in value && value.text != null) {
        const t = String(value.text).trim();
        return t === '' ? null : t;
      }
      if ('result' in value && value.result != null) {
        return this.cellToString(value.result as ExcelJS.CellValue);
      }
    }
    return null;
  }

  private cellToNumber(value: ExcelJS.CellValue): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'result' in value) {
      return this.cellToNumber(value.result as ExcelJS.CellValue);
    }
    const s = this.cellToString(value);
    if (s == null) return null;
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private siNo(value: ExcelJS.CellValue): boolean | null {
    const s = this.cellToString(value)?.toUpperCase();
    if (s == null) return null;
    if (['SI', 'SÍ', 'S', 'TRUE', '1', 'YES'].includes(s)) return true;
    if (['NO', 'N', 'FALSE', '0'].includes(s)) return false;
    return null;
  }

  // ────────────────────────────────────────────────────────────────────
  // Resolución de referencias (unidades / categorías)
  // ────────────────────────────────────────────────────────────────────

  private async cargarUnidades(manager: EntityManager) {
    const unidades = await manager.getRepository(Unidad).find();
    const map = new Map<string, Unidad>();
    for (const u of unidades) {
      map.set(u.nombre.toLowerCase().trim(), u);
      if (u.abreviatura) map.set(u.abreviatura.toLowerCase().trim(), u);
    }
    return map;
  }

  private resolverUnidad(
    unidadPorNombre: Map<string, Unidad>,
    fila: FilaImport,
  ): Unidad {
    const clave = fila.unidad?.toLowerCase().trim();
    if (clave) {
      const u = unidadPorNombre.get(clave);
      if (u) return u;
      throw new BadRequestException(
        `Fila ${fila.fila} (${fila.sku}): unidad "${fila.unidad}" no existe en el sistema.`,
      );
    }
    // Sin unidad indicada: por gramos → Gramo, si no → Unidad
    const porDefecto = fila.es_por_gramos
      ? (unidadPorNombre.get('gramo') ?? unidadPorNombre.get('g'))
      : (unidadPorNombre.get('unidad') ?? unidadPorNombre.get('u'));
    if (!porDefecto) {
      throw new BadRequestException(
        `Fila ${fila.fila} (${fila.sku}): no se indicó unidad y no existe una unidad por defecto.`,
      );
    }
    return porDefecto;
  }

  private async resolverCategorias(
    manager: EntityManager,
    filas: FilaImport[],
  ) {
    const repo = manager.getRepository(Categoria);
    const existentes = await repo.find();
    const categoriaPorNombre = new Map<string, Categoria>(
      existentes.map((c) => [c.nombre.toLowerCase().trim(), c]),
    );

    const categoriasCreadas: string[] = [];
    for (const fila of filas) {
      const nombre = fila.categoria?.trim();
      if (!nombre) continue;
      const clave = nombre.toLowerCase();
      if (!categoriaPorNombre.has(clave)) {
        const nueva = await repo.save(repo.create({ nombre }));
        categoriaPorNombre.set(clave, nueva);
        categoriasCreadas.push(nombre);
      }
    }
    return { categoriaPorNombre, categoriasCreadas };
  }

  private esGramos(u?: Unidad) {
    const abbr = u?.abreviatura?.toLowerCase()?.trim();
    const name = u?.nombre?.toLowerCase()?.trim();
    return (
      abbr === 'g' || abbr === 'gr' || name === 'gramo' || !!name?.startsWith('gram')
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Eliminación definitiva con historial
  // ────────────────────────────────────────────────────────────────────

  /**
   * Borra los productos indicados junto con TODO su historial
   * (items de venta, items facturados, movimientos de stock e items de
   * órdenes de compra). Orden dictado por las claves foráneas.
   */
  private async eliminarProductosConHistorial(
    manager: EntityManager,
    productoIds: number[],
  ) {
    const ids = productoIds;

    await manager.query(
      `DELETE FROM factura_venta_item
        WHERE venta_item_id IN (
          SELECT id FROM venta_item WHERE producto_id = ANY($1)
        )`,
      [ids],
    );
    await manager.query(
      `DELETE FROM venta_item WHERE producto_id = ANY($1)`,
      [ids],
    );
    await manager.query(
      `DELETE FROM movimiento_stock WHERE producto_id = ANY($1)`,
      [ids],
    );
    await manager.query(
      `DELETE FROM orden_compra_item WHERE producto_id = ANY($1)`,
      [ids],
    );
    await manager.query(
      `DELETE FROM promocion_producto WHERE producto_id = ANY($1)`,
      [ids],
    );
    await manager.query(
      `DELETE FROM "promocion-producto" WHERE producto_id = ANY($1)`,
      [ids],
    );
    await manager.query(
      `DELETE FROM parametros_reorden WHERE producto_id = ANY($1)`,
      [ids],
    );
    await manager.query(
      `DELETE FROM stock_actual WHERE producto_id = ANY($1)`,
      [ids],
    );
    // producto_precio_almacen y producto_precio_historial caen por CASCADE
    await manager.getRepository(Producto).delete({ id: In(ids) });
  }

  // ────────────────────────────────────────────────────────────────────
  // Auditoría de precios
  // ────────────────────────────────────────────────────────────────────

  private async resolveUserForAudit(manager: EntityManager, user?: AuthUser) {
    const userId = user?.id;
    if (!userId) return { usuario_id: null, usuario_nombre: null };

    const u = await manager.getRepository(Usuario).findOne({
      where: { id: userId },
      select: ['id', 'nombre', 'usuario'],
    });
    return {
      usuario_id: String(userId),
      usuario_nombre: u?.nombre ?? u?.usuario ?? String(userId),
    };
  }

  private async auditPrecio(
    manager: EntityManager,
    params: {
      producto_id: number;
      almacen_id: number | null;
      tipo: PrecioHistorialTipo;
      precio_anterior: number | null;
      precio_nuevo: number | null;
      usuario_id: string | null;
      usuario_nombre: string | null;
    },
  ) {
    await manager.getRepository(ProductoPrecioHistorial).insert({
      producto_id: params.producto_id,
      almacen_id: params.almacen_id,
      tipo: params.tipo,
      precio_anterior:
        params.precio_anterior == null ? null : String(params.precio_anterior),
      precio_nuevo:
        params.precio_nuevo == null ? null : String(params.precio_nuevo),
      usuario_id: params.usuario_id,
      usuario_nombre: params.usuario_nombre,
      origen: ORIGEN_IMPORT,
    });
  }
}
