import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaCorriente } from './cuenta-corriente.entity';
import { CuentaCorrienteVenta } from './cuenta-corriente-venta.entity';
import { CuentaCorrientePago } from './cuenta-corriente-pago.entity';
import { CuentaCorrientePagoAplicacion } from './cuenta-corriente-pago-aplicacion.entity';
import { CuentaCorrienteMovimiento } from './cuenta-corriente-movimiento.entity';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { CuentaCorrienteController } from './cuenta-corriente.controller';
import { SesionCaja } from 'src/caja/sesion-caja.entity';
import { MovimientoCaja } from 'src/caja/movimiento-caja.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CuentaCorriente,
      CuentaCorrienteVenta,
      CuentaCorrientePago,
      CuentaCorrientePagoAplicacion,
      CuentaCorrienteMovimiento,
      SesionCaja,
      MovimientoCaja,
    ]),
  ],
  providers: [CuentaCorrienteService],
  controllers: [CuentaCorrienteController],
  exports: [CuentaCorrienteService],
})
export class CuentaCorrienteModule {}
