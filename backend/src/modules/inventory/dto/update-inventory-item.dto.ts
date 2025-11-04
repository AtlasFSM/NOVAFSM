import { PartialType } from '@nestjs/swagger';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

/**
 * Update Inventory Item DTO - All fields optional
 */
export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {}
