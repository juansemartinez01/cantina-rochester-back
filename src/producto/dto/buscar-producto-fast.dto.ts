import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { BuscarProductoDto } from './buscar-producto.dto';

export class BuscarProductoFastDto extends BuscarProductoDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
