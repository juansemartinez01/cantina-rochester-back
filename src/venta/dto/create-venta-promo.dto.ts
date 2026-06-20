import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVentaPromoDto {
  @Type(() => Number)
  @IsInt()
  promocionId: number;

  @Type(() => Number)
  @IsInt()
  cantidad: number;
}
