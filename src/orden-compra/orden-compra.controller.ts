// src/orden-compra/orden-compra.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { OrdenCompraService } from './orden-compra.service';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';
import { OrdenCompra } from './orden-compra.entity';
import { FiltroOrdenCompraDto } from './dto/filtro-orden-compra.dto';
import { AnularOrdenCompraDto } from './dto/anular-orden-compra.dto';
import { UpdateOrdenCompraDto } from './dto/update-orden-compra.dto';

@Controller('orden-compra')
export class OrdenCompraController {
  constructor(private readonly service: OrdenCompraService) {}

  @Post('ingresar-stock')
  async ingresarStock(@Body() dto: CreateOrdenCompraDto) {
    return this.service.crearOrdenConStock(dto);
  }

  

  

  @Get()
  async obtenerTodas(@Query() filtros: FiltroOrdenCompraDto) {
    return this.service.obtenerTodasConFiltros(filtros);
  }


  @Get(':id')
  async obtener(@Param('id') id: string) {
    return this.service.obtenerDetalle(+id);
  }

  @Delete(':id')
  async anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularOrdenCompraDto,
  ) {
    return this.service.anularOrden(id, dto);
  }

  @Patch(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdenCompraDto,
  ) {
    return this.service.actualizarOrden(id, dto);
  }

}
