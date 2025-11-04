import { PartialType } from '@nestjs/swagger';
import { CreateExpenseEntryDto } from './create-expense-entry.dto';

/**
 * Update Expense Entry DTO - All fields optional
 */
export class UpdateExpenseEntryDto extends PartialType(CreateExpenseEntryDto) {}
