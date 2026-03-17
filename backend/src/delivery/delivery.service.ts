/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface NovaPoshtaResponse {
  success: boolean;
  data?: Array<{ Ref: string; Addresses?: Array<{ Present: string }> }>;
  errors?: string[];
}

@Injectable()
export class DeliveryService implements OnModuleInit {
  private readonly logger = new Logger(DeliveryService.name);
  private readonly apiUrl = 'https://api.novaposhta.ua/v2.0/json/';
  private fastivRef: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initTargetCityRef();
  }

  private async initTargetCityRef(): Promise<void> {
    const apiKey = this.configService.get<string>('NP_API_KEY');

    try {
      const response = await axios.post<NovaPoshtaResponse>(this.apiUrl, {
        apiKey,
        modelName: 'AddressGeneral',
        calledMethod: 'getSettlements',
        methodProperties: {
          FindByString: 'фастів',
        },
      });

      const data = response.data;

      if (data.success && data.data!.length > 0 && data.data![0].Ref) {
        this.fastivRef = data.data![0].Ref;
        this.logger.debug(`Fastiv Ref found: ${this.fastivRef}`);
      } else {
        this.logger.error('Failed to find Fastiv in Nova Poshta database.');
      }
    } catch (error) {
      this.logger.error(`Failed to find Fastiv: ${error.message}`);
    }
  }

  async searchStreets(streetName: string): Promise<{ data: string[] }> {
    const apiKey = this.configService.get<string>('NP_API_KEY');

    if (!this.fastivRef) {
      await this.initTargetCityRef();
      if (!this.fastivRef) {
        throw new HttpException(
          'Fastiv not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    try {
      const response = await axios.post<NovaPoshtaResponse>(this.apiUrl, {
        apiKey,
        modelName: 'AddressGeneral',
        calledMethod: 'searchSettlementStreets',
        methodProperties: {
          StreetName: streetName,
          SettlementRef: this.fastivRef,
        },
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.errors!.join(', '));
      }

      const outputStreets = data.data![0]?.Addresses?.map((e) => e.Present);

      return outputStreets ? { data: outputStreets } : { data: [] };
    } catch (error) {
      this.logger.error(`Failed to search streets: ${error.message}`);
      throw new HttpException(
        'Помилка API Нової Пошти',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
