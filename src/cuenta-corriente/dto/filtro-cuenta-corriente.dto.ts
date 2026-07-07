import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FiltroCuentaCorrienteDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsBooleanString()
  activa?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsIn(['nombre', 'saldoActual', 'createdAt'])
  orderBy?: 'nombre' | 'saldoActual' | 'createdAt' = 'nombre';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}
