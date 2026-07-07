import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  Query,
  Patch,
} from '@nestjs/common';
import { PromocionService } from './promocion.service';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { UpdatePromocionDto } from './dto/update-promocion.dto';
import { QueryProductosPromocionActivaDto } from './dto/query-productos-promocion-activa.dto';

@Controller('promociones')
export class PromocionController {
  constructor(private readonly service: PromocionService) {}

  @Post()
  create(@Body() dto: CreatePromocionDto) {
    return this.service.create(dto);
  }

  @Get('activas')
  getActivas(@Query('almacenId') almacenId?: string) {
    return this.service.findActivas(this.parseOptionalId(almacenId));
  }

  @Get('activas/productos')
  getProductosEnPromocionesActivas(
    @Query() query: QueryProductosPromocionActivaDto,
  ) {
    return this.service.findProductosEnPromocionesActivas(query);
  }

  @Get('codigo/:codigo')
  findByCodigo(
    @Param('codigo') codigo: string,
    @Query('almacenId') almacenId?: string,
  ) {
    return this.service.findByCodigo(codigo, this.parseOptionalId(almacenId));
  }

  @Get()
  findAll(@Query('almacenId') almacenId?: string) {
    return this.service.findAll(this.parseOptionalId(almacenId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromocionDto) {
    return this.service.update(+id, dto);
  }

  @Patch(':id/activar')
  activar(@Param('id') id: string) {
    return this.service.activar(+id);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(+id);
  }

  @Delete(':id/logico')
  async borrarLogico(@Param('id') id: string) {
    return this.service.desactivar(+id);
  }

  private parseOptionalId(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
