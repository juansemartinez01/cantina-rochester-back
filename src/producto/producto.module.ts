import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { Producto } from './producto.entity';
import { Unidad } from 'src/unidad/unidad.entity';
import { ProductoPrecioAlmacen } from 'src/producto-precio-almacen/producto-precio-almacen.entity';
import { Usuario } from 'src/usuario/usuario.entity';
import { ProductoPrecioHistorial } from 'src/producto-precio-historial/producto-precio-historial.entity';
import { ProductoPrecioHistorialService } from 'src/producto-precio-historial/producto-precio-historial.service';
import { ProductoPrecioHistorialModule } from 'src/producto-precio-historial/producto-precio-historial.module';
import { StockActual } from 'src/stock-actual/stock-actual.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Unidad,
      ProductoPrecioAlmacen,
      Usuario,
      StockActual,
    ]),
    ProductoPrecioHistorialModule,
  ],
  providers: [ProductoService],
  controllers: [ProductoController],
  exports: [ProductoService],
})
export class ProductoModule {}

// Fuerza nuevo build para Railway
