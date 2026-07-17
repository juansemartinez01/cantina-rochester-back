// src/auth/dto/login.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
