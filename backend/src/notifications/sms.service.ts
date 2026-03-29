/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TurboSmsResponse {
  response_code: number;
  response_status: string;
  response_result?: Array<{ message_id: string }>;
}

@Injectable()
export class SmsService {
  private logger = new Logger(SmsService.name);
  private readonly apiUrl = 'https://api.turbosms.ua/message/send.json';

  constructor(private readonly configService: ConfigService) {}

  sendVerificationCodeMock(phoneNumber: string, code: string): void {
    this.logger.debug(`[MOCK SMS] To: ${phoneNumber} | Code: ${code}`);
  }

  async sendSms(phoneNumber: string, text: string): Promise<void> {
    const token = this.configService.get<string>('TURBOSMS_TOKEN');
    const sender = this.configService.get<string>('TURBOSMS_SENDER', 'Msg');

    const recipient = phoneNumber.replace('+', '').replaceAll(' ', '');

    const payload = {
      recipients: [recipient],
      sms: {
        sender,
        text,
      },
    };

    try {
      this.logger.debug(`Sending SMS to ${phoneNumber} via TurboSMS...`);

      const response = await axios.post<TurboSmsResponse>(
        this.apiUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      if (
        response.data.response_code === 0 ||
        response.data.response_code === 800 ||
        response.data.response_status === 'OK' ||
        response.data.response_status === 'SUCCESS_MESSAGE_SENT'
      ) {
        this.logger.log(
          `SMS sent successfully. ID: ${response.data.response_result?.[0]?.message_id}`,
        );
      } else {
        this.logger.error(`TurboSMS error: ${response.data.response_status}`);
        throw new Error('SMS provider error');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        this.logger.error('TurboSMS timeout after 5000ms');
        throw new ServiceUnavailableException(
          'Сервіс відправки СМС тимчасово недоступний. Спробуйте пізніше.',
        );
      }

      this.logger.error(`Failed to send SMS: ${error.stack}`);
    }
  }
}
