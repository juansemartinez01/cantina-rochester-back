import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './producto.entity';
import { BuscarProductoDto } from './dto/buscar-producto.dto';
import { BuscarProductoFastDto } from './dto/buscar-producto-fast.dto';
import { UpsertPrecioDto } from 'src/producto-precio-almacen/dto/upsert-precio.dto';
import { UpdateProductoCargaRapidaDto } from './dto/update-producto-carga-rapida.dto';
import { ProductoPrecioHistorialService } from 'src/producto-precio-historial/producto-precio-historial.service';
import { QueryPrecioHistorialDto } from 'src/producto-precio-historial/dto/query-precio-historial.dto';
import { Request } from 'express';


@Controller('productos')
export class ProductoController {
  constructor(
    private readonly service: ProductoService,
    private readonly precioHistService: ProductoPrecioHistorialService,
  ) {}

  // ───────────────────────────────────────────────────────────────────
  // Búsqueda avanzada
  // ───────────────────────────────────────────────────────────────────
  @Get('buscar')
  buscar(@Query() filtros: BuscarProductoDto) {
    return this.service.buscarConFiltros(filtros);
  }

  @Get('buscar-fast')
  buscarFast(@Query() filtros: BuscarProductoFastDto) {
    return this.service.buscarConFiltrosFast(filtros);
  }

  // ───────────────────────────────────────────────────────────────────
  // Precio por almacén (override)
  // ───────────────────────────────────────────────────────────────────
  @Post('precio-override')
  upsertPrecio(
    @Req() req: Request & { user?: any },
    @Body() dto: UpsertPrecioDto,
  ) {
    return this.service.upsertPrecioAlmacen(dto, req.user);
  }

  @Delete('precio-override/:productoId/:almacenId')
  removePrecio(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('almacenId', ParseIntPipe) almacenId: number,
  ) {
    return this.service.removePrecioAlmacen(productoId, almacenId);
  }

  @Get(':id/precio')
  getPrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('almacenId') almacenId?: string,
  ) {
    return this.service.getPrecioFinal(
      id,
      almacenId ? Number(almacenId) : undefined,
    );
  }

  @Get('precios/historial')
  historialPrecios(@Query() q: QueryPrecioHistorialDto) {
    return this.precioHistService.obtenerHistorial(q);
  }

  // ───────────────────────────────────────────────────────────────────
  // Buscar por código de barras (antes de :id para evitar colisión)
  // ───────────────────────────────────────────────────────────────────
  @Get('barcode/:code')
  findByBarcode(@Param('code') code: string) {
    return this.service.findByBarcode(code);
  }

  // ───────────────────────────────────────────────────────────────────
  // CRUD base
  // ───────────────────────────────────────────────────────────────────
  @Get()
  getAll(): Promise<Producto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<Producto> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductoDto): Promise<Producto> {
    return this.service.create(dto);
  }

  @Put('carga-rapida')
  updateCargaRapida(@Body() dto: UpdateProductoCargaRapidaDto) {
    return this.service.updateCargaRapida(dto);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user?: any },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ): Promise<Producto> {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  async borrarLogico(@Param('id', ParseIntPipe) id: number) {
    return this.service.borrarLogicamente(id);
  }
}
