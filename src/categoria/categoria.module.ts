import { Module } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CategoriaController } from './categoria.controller';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Categoria } from './categoria.entity';
import { Producto } from '../producto/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Producto])],
  controllers: [CategoriaController],
  providers: [CategoriaService],
})
export class CategoriaModule {}
