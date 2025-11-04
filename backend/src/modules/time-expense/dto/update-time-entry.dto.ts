import { PartialType } from '@nestjs/swagger';
import { CreateTimeEntryDto } from './create-time-entry.dto';

/**
 * Update Time Entry DTO - All fields optional
 */
export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {}
