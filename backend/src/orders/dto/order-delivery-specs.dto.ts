import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DeliverySpecificationsDto {
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  apartment: string;

  @IsEnum(['CASH', 'CARD_TERMINAL'])
  @IsNotEmpty()
  paymentMethod: 'CASH' | 'CARD_TERMINAL';

  @IsString()
  @IsOptional()
  @MaxLength(200)
  comment?: string;
}
