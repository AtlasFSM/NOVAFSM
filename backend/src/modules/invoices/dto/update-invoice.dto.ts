import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

/**
 * Update Invoice DTO - All fields optional
 */
export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
