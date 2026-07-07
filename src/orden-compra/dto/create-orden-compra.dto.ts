// src/orden-compra/dto/create-orden-compra.dto.ts
import {
  IsInt,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrdenCompraItemDto } from './create-orden-compra-item.dto';

export class CreateOrdenCompraDto {
  @IsInt()
  proveedorId: number;
  @IsInt()
  almacenId: number;
  @IsInt()
  usuarioId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  numeroComprobante?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrdenCompraItemDto)
  @ArrayMinSize(1)
  items: CreateOrdenCompraItemDto[];
}
