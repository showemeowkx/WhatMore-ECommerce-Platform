import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('streets')
  @UseGuards(JwtAuthGuard)
  async searchStreets(
    @Query('search') search: string,
  ): Promise<{ data: string[] }> {
    if (!search || search.length < 2) {
      return { data: [] };
    }
    return this.deliveryService.searchStreets(search);
  }
}
