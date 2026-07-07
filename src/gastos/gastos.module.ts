import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastosController } from './gastos.controller';
import { GastosService } from './gastos.service';
import { Gasto } from './gasto.entity';
import { GastoCategoria } from './gasto-categoria.entity';
import { Almacen } from 'src/almacen/almacen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto, GastoCategoria, Almacen])],
  controllers: [GastosController],
  providers: [GastosService],
  exports: [GastosService],
})
export class GastosModule {}
