import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoPrecioHistorial } from './producto-precio-historial.entity';
import { ProductoPrecioHistorialService } from './producto-precio-historial.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductoPrecioHistorial])],
  providers: [ProductoPrecioHistorialService],
  exports: [TypeOrmModule, ProductoPrecioHistorialService],
})
export class ProductoPrecioHistorialModule {}
