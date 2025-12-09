import { IsNotEmpty, IsString, IsNumber, IsPositive, IsOptional, Min, IsBoolean, Matches } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  // Regex: solo minúsculas, números y guiones (ej: zapatillas-nike-air)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug debe contener solo letras minúsculas, números y guiones',
  })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}