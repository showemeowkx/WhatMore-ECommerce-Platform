import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class NotificationsModule {}
