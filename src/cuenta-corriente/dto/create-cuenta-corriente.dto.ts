import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCuentaCorrienteDto {
  @IsString()
  @MaxLength(255)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documento?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
