import { PartialType } from '@nestjs/swagger';
import { CreateSiteDto } from './create-site.dto';
import { OmitType } from '@nestjs/swagger';

// Omit customerId as it shouldn't be updated
export class UpdateSiteDto extends PartialType(OmitType(CreateSiteDto, ['customerId'] as const)) {}
