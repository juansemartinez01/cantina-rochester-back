import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCuentaCorrienteDto } from './create-cuenta-corriente.dto';

export class UpdateCuentaCorrienteDto extends PartialType(CreateCuentaCorrienteDto) {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
