import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { CreateCuentaCorrienteDto } from './dto/create-cuenta-corriente.dto';
import { UpdateCuentaCorrienteDto } from './dto/update-cuenta-corriente.dto';
import { FiltroCuentaCorrienteDto } from './dto/filtro-cuenta-corriente.dto';
import { FiltroCuentaCorrienteDetalleDto } from './dto/filtro-cuenta-corriente-detalle.dto';
import { CreateCuentaCorrientePagoDto } from './dto/create-cuenta-corriente-pago.dto';
import { CreateCuentaCorrienteAjusteDto } from './dto/create-cuenta-corriente-ajuste.dto';

@Controller('cuentas-corrientes')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class CuentaCorrienteController {
  constructor(private readonly service: CuentaCorrienteService) {}

  @Post()
  crear(@Body() dto: CreateCuentaCorrienteDto) {
    return this.service.crear(dto);
  }

  @Get()
  listar(@Query() filtro: FiltroCuentaCorrienteDto) {
    return this.service.listar(filtro);
  }

  @Get(':id/resumen')
  obtenerResumen(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerResumen(id);
  }

  @Get(':id/ventas')
  listarVentas(
    @Param('id', ParseIntPipe) id: number,
    @Query() filtro: FiltroCuentaCorrienteDetalleDto,
  ) {
    return this.service.listarVentas(id, filtro);
  }

  @Get(':id/movimientos')
  listarMovimientos(
    @Param('id', ParseIntPipe) id: number,
    @Query() filtro: FiltroCuentaCorrienteDetalleDto,
  ) {
    return this.service.listarMovimientos(id, filtro);
  }

  @Post(':id/pagos')
  registrarPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCuentaCorrientePagoDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.service.registrarPago(id, dto, req.user?.id);
  }

  @Post(':id/ajustes')
  registrarAjuste(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCuentaCorrienteAjusteDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.service.registrarAjuste(id, dto, req.user?.id);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCuentaCorrienteDto,
  ) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.desactivar(id);
  }
}
