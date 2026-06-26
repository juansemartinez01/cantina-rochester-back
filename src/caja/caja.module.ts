import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionCaja } from './sesion-caja.entity';
import { MovimientoCaja } from './movimiento-caja.entity';
import { IngresoVenta } from 'src/ingreso/ingreso-venta.entity';
import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SesionCaja, MovimientoCaja, IngresoVenta]),
  ],
  controllers: [CajaController],
  providers: [CajaService],
})
export class CajaModule {}
