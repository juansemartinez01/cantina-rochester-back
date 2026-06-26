import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CajaService } from './caja.service';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { AgregarMovimientoDto } from './dto/agregar-movimiento.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { AnularMovimientoDto } from './dto/anular-movimiento.dto';

@Controller('caja')
export class CajaController {
  constructor(private readonly service: CajaService) {}

  // US1 — Abrir caja
  @Post('abrir')
  abrir(
    @Body() dto: AbrirCajaDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.service.abrir(dto, req.user?.id);
  }

  // US6 — Obtener caja activa por almacén
  @Get('activa')
  obtenerActiva(@Query('almacen_id', ParseIntPipe) almacenId: number) {
    return this.service.obtenerActiva(almacenId);
  }

  // Polish — Historial de sesiones (admin)
  @Get('historial')
  historial(
    @Query('almacen_id') almacen_id?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.service.listarSesiones({
      almacen_id: almacen_id ? +almacen_id : undefined,
      desde,
      hasta,
      page: +page,
      limit: +limit,
    });
  }

  // US4 — Reporte de sesión
  @Get(':id/reporte')
  reporte(@Param('id', ParseIntPipe) id: number) {
    return this.service.getReporte(id);
  }

  // US2/US3 — Agregar movimiento manual (INGRESO, EGRESO, RETIRO)
  @Post(':id/movimiento')
  agregarMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarMovimientoDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.service.agregarMovimiento(id, dto, req.user?.id);
  }

  // US4 — Cerrar caja
  @Post(':id/cerrar')
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CerrarCajaDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.service.cerrar(id, dto, req.user?.id);
  }

  // US5 — Anular movimiento
  @Patch('movimiento/:id/anular')
  anularMovimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularMovimientoDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.service.anularMovimiento(id, dto, req.user?.id);
  }
}
