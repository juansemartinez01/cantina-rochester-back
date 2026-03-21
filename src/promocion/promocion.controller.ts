import { Controller, Post, Body, Get, Param, Delete, Put, Query } from '@nestjs/common';
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
  getActivas() {
    return this.service.findActivas();
  }

  @Get('activas/productos')
  getProductosEnPromocionesActivas(
    @Query() query: QueryProductosPromocionActivaDto,
  ) {
    return this.service.findProductosEnPromocionesActivas(query);
  }

  @Get('codigo/:codigo')
    findByCodigo(@Param('codigo') codigo: string) {
    return this.service.findByCodigo(codigo);
    }

  @Get()
  findAll() {
    return this.service.findAll();
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

  @Delete(':id/logico')
  async borrarLogico(@Param('id') id: string) {
    return this.service.borrarLogicamente(+id);
  }


}
