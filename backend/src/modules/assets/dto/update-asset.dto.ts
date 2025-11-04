import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAssetDto, AssetStatus } from './create-asset.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @ApiPropertyOptional({
    enum: AssetStatus,
    description: 'Asset status',
    example: AssetStatus.IN_USE,
  })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}
