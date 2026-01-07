import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryMovementDto } from './create-inventory-movement.dto';

export class UpdateInventoryDto extends PartialType(CreateInventoryMovementDto) {}
