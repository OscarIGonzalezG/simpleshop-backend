import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  // ---------- USER (Solo esto pediremos al principio) ----------
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MaxLength(120)
  fullname: string;
}