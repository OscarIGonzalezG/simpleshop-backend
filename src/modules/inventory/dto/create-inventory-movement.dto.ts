import { IsNotEmpty, IsEnum, IsInt, IsPositive, IsUUID, IsOptional, IsString } from 'class-validator';
import { MovementType } from '../entities/inventory-movement.entity';

export class CreateInventoryMovementDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type: MovementType;

  @IsInt()
  @IsPositive() // Evitamos cantidades negativas o cero
  quantity: number;

  @IsString()
  @IsOptional()
  comment?: string;
}