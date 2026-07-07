import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateGastoCategoriaDto } from './create-gasto-categoria.dto';

export class UpdateGastoCategoriaDto extends PartialType(CreateGastoCategoriaDto) {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
