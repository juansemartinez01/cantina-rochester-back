import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promocion } from './promocion.entity';
import { PromocionProducto } from './promocion-producto.entity';
import { PromocionService } from './promocion.service';
import { PromocionController } from './promocion.controller';
import { Producto } from 'src/producto/producto.entity';
import { Almacen } from 'src/almacen/almacen.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promocion, PromocionProducto, Producto, Almacen]),
  ],
  providers: [PromocionService],
  controllers: [PromocionController],
  exports: [PromocionService],
})
export class PromocionModule {}
