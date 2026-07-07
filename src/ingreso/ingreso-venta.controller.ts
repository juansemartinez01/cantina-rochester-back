import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { IngresoVentaService } from './ingreso-venta.service';
import { CreateIngresoVentaDto } from './dto/create-ingreso-venta.dto';
import { FiltroIngresoVentaDto } from './dto/filtro-ingreso-venta.dto';
import { normalizarFiltroMetodoPago } from 'src/common/metodo-pago.enum';

@Controller('ingreso-venta')
export class IngresoVentaController {
  constructor(private readonly service: IngresoVentaService) {}

  @Post()
  async crear(@Body() dto: CreateIngresoVentaDto) {
    return this.service.registrarIngreso(dto);
  }

  @Get()
async obtenerIngresosConFiltros(
  @Query('tipo') tipo?: string,
  @Query('ventaId') ventaId?: string,
  @Query('montoMin') montoMin?: string,
  @Query('montoMax') montoMax?: string,
  @Query('fechaDesde') fechaDesde?: string,
  @Query('fechaHasta') fechaHasta?: string,
  @Query('almacenId') almacenId?: string, // ✅ nuevo
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '50',
  @Query('ordenCampo') ordenCampo: string = 'fecha',
  @Query('ordenDireccion') ordenDireccion: 'ASC' | 'DESC' = 'DESC',
) {
  const tipoFiltrado = normalizarFiltroMetodoPago(tipo);

  return this.service.obtenerTodosConFiltros({
    tipo: tipoFiltrado,
    ventaId: ventaId ? +ventaId : undefined,
    montoMin: montoMin ? +montoMin : undefined,
    montoMax: montoMax ? +montoMax : undefined,
    fechaDesde,
    fechaHasta,
    almacenId: almacenId ? +almacenId : undefined, 
    page: +page,
    limit: +limit,
    ordenCampo,
    ordenDireccion,
  });
}



  @Get('resumen')
  async resumen(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('almacenId') almacenId?: string, 
  ) {
    return this.service.obtenerResumen({
      fechaDesde,
      fechaHasta,
      almacenId: almacenId ? +almacenId : undefined, 
    });
  }


}
