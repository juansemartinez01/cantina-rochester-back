import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastosController } from './gastos.controller';
import { GastosService } from './gastos.service';
import { Gasto } from './gasto.entity';
import { GastoCategoria } from './gasto-categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto, GastoCategoria])],
  controllers: [GastosController],
  providers: [GastosService],
  exports: [GastosService],
})
export class GastosModule {}
