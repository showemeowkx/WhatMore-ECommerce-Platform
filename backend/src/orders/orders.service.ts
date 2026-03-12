/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/auth/entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CartService } from 'src/cart/cart.service';
import { ConfigService } from '@nestjs/config';
import { ProductStock } from 'src/products/entities/product-stock.entity';
import { SyncService } from 'src/sync/sync.service';
import { GetOrdersDto } from './dto/get-orders.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AutoClearCache } from 'src/common/decorators/auto-clear-cache.decorator';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { SmsService } from 'src/notifications/sms.service';
import { DeliverySpecificationsDto } from './dto/order-delivery-specs.dto';

@Injectable()
export class OrdersService {
  private logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(ProductStock)
    private stockRepository: Repository<ProductStock>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly syncService: SyncService,
    private readonly smsService: SmsService,
    @Inject(CACHE_MANAGER) public cacheManager: Cache,
  ) {}

  @AutoClearCache('/orders')
  async create(
    user: User,
    deliverySpecs: DeliverySpecificationsDto,
  ): Promise<void> {
    const cart = await this.cartService.getCartByUserId(user.id);

    if (!cart.items || cart.items.length === 0) {
      this.logger.error(`Cart is empty {userId: ${user.id}}`);
      throw new BadRequestException('Кошик пустий.');
    }

    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    for (const cartItem of cart.items) {
      if (!cartItem.product || !cartItem.product.isActive) {
        this.logger.error(
          `Product is inactive or not found {productId: ${cartItem.product?.id}}`,
        );
        throw new ConflictException(
          `Товар ${cartItem.product.name} недоступний для замовлення.`,
        );
      }

      const itemPrice = cartItem.product.isPromo
        ? cartItem.product.pricePromo
        : cartItem.product.price;
      totalAmount += cartItem.quantity * itemPrice;

      const orderItem = this.orderItemRepository.create({
        product: cartItem.product,
        productImagePath: cartItem.product.imagePath,
        productName: cartItem.product.name,
        productCode: cartItem.product.code,
        categoryName: cartItem.product.lastSyncedCategoryName,
        productUnitsOfMeasurments: cartItem.product.unitsOfMeasurments,
        priceAtPurchase: itemPrice,
        quantity: cartItem.quantity,
      });

      orderItems.push(orderItem);
    }

    const minOrderAmout =
      this.configService.get<number>('MIN_ORDER_AMNT') || 500;

    if (totalAmount < minOrderAmout) {
      this.logger.error(`Minimum order sum is ${minOrderAmout} UAH`);
      throw new ConflictException(
        `Мінімальна сума замовлення ${minOrderAmout} UAH.`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const chosenStore = user.selectedStoreId;
      const productIds = orderItems.map((item) => item.product.id);

      const stocks = await qr.manager.find(ProductStock, {
        where: {
          productId: In(productIds),
          storeId: chosenStore,
        },
        lock: { mode: 'pessimistic_write' },
      });

      for (const item of orderItems) {
        const stock = stocks.find((s) => s.productId === item.product.id);

        if (!stock || stock.available < item.quantity) {
          throw new ConflictException(
            `Недостатньо товарів у наявності для ${item.productName}`,
          );
        }

        stock.reserved = Number(stock.reserved) + Number(item.quantity);
      }

      if (stocks.length > 0) {
        await qr.manager.save(stocks);
      }

      const newOrder = qr.manager.create(Order, {
        user,
        totalAmount,
        status: OrderStatus.IN_PROCESS,
        items: orderItems,
        storeId: user.selectedStoreId,
        store: user.selectedStore,
        deliveryAddress: deliverySpecs.deliveryAddress,
        apartment: deliverySpecs.apartment,
        paymentMethod: deliverySpecs.paymentMethod,
        comment: deliverySpecs.comment,
        createdAt: new Date(),
      });

      const savedOrder = await qr.manager.save(newOrder);

      const date = savedOrder.createdAt;
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');

      savedOrder.orderNumber = `${yyyy}${mm}${dd}-${savedOrder.id}`;

      await qr.manager.save(savedOrder);
      await qr.manager.delete(CartItem, { cart: { id: cart.id } });

      if (this.configService.get<string>('NODE_ENV') === 'prod') {
        await this.smsService.sendSms(
          user.phone,
          `Ваше замовлення у магазині "Що? Ще?" за адресою ${user.selectedStore.address} прийнято,\nСлідкуйте в додатку за номером: ${savedOrder.orderNumber}`,
        );
      } else {
        this.logger.debug(
          `[MOCK SMS] To: ${user.phone} | Message: Ваше замовлення у магазині "Що? Ще?" за адресою ${user.selectedStore.address} прийнято,\nСлідкуйте в додатку за номером: ${savedOrder.orderNumber}`,
        );
      }
      await qr.commitTransaction();
      this.logger.debug(`Order placed successfully! {userId: ${user.id}}`);
    } catch (error) {
      await qr.rollbackTransaction();
      this.logger.error(`Failed to create an order: ${error.stack}`);
      throw new InternalServerErrorException(
        'Не вдалося створити замовлення. Спробуйте ще раз пізніше.',
      );
    } finally {
      await qr.release();
    }
  }

  async findAll(getOrdersDto: GetOrdersDto): Promise<{
    data: Order[];
    metadata: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, status, storeId, search } = getOrdersDto;

    const qb = this.orderRepository.createQueryBuilder('order');

    qb.leftJoinAndSelect('order.user', 'user');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (storeId) {
      qb.andWhere('order.storeId = :storeId', { storeId });
    }

    if (search) {
      qb.andWhere('order.orderNumber LIKE :search', { search: `%${search}%` });
    }

    qb.skip((page - 1) * limit);
    qb.orderBy('order.createdAt', 'DESC');
    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllByUser(
    userId: number,
    paginationOptions: { page: number; limit: number },
  ): Promise<{
    data: Order[];
    metadata: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = paginationOptions;

    const qb = this.orderRepository.createQueryBuilder('order');

    qb.andWhere('order.user.id = :userId', { userId });
    qb.skip((page - 1) * limit);
    qb.orderBy('order.createdAt', 'DESC');
    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user', 'store'],
    });

    if (!order) {
      this.logger.error(`Order not found {orderId: ${id}}`);
      throw new NotFoundException('Замовлення не знайдено.');
    }

    return order;
  }

  @AutoClearCache('/orders')
  async remove(id: number): Promise<void> {
    const result = await this.orderRepository.delete(id);

    if (result.affected === 0) {
      this.logger.error(`Order with ID ${id} not found`);
      throw new NotFoundException('Замовлення не знайдено.');
    }
  }

  @AutoClearCache('/orders')
  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

    if (status === OrderStatus.READY) {
      const productsToUpdate = this.getProductsToUpdate(order);
      const prevSyncState = this.syncService.getSyncStatus().running;

      await this.syncService.setSyncState(false);

      await this.syncService.syncProducts(productsToUpdate);
      await this.releaseReservation(order);

      await this.syncService.setSyncState(prevSyncState);

      if (this.configService.get<string>('NODE_ENV') === 'prod') {
        await this.smsService.sendSms(
          order.user.phone,
          `Замовлення номер ${order.orderNumber} у процесі доставки. Кур'єр зв'яжеться з вами найближчим часом!`,
        );
      } else {
        this.logger.debug(
          `[MOCK SMS] To: ${order.user.phone} | Message: Замовлення номер ${order.orderNumber} у процесі доставки. Кур'єр зв'яжеться з вами найближчим часом!`,
        );
      }
    }
    if (status === OrderStatus.CANCELLED) {
      await this.releaseReservation(order);
    }

    order.status = status;
    return this.orderRepository.save(order);
  }

  private getProductsToUpdate(order: Order) {
    this.logger.debug(`Getting products to update... {orderId: ${order.id}}`);
    const products: number[] = [];

    for (const item of order.items) {
      products.push(item.product.ukrskladId);
    }

    return products;
  }

  @AutoClearCache('/products')
  private async releaseReservation(order: Order) {
    this.logger.debug(`Releasing reservation... {orderId: ${order.id}}`);

    if (!order.items || order.items.length === 0) return;
    const productIds = order.items.map((item) => item.product.id);

    const stocks = await this.stockRepository.find({
      where: {
        productId: In(productIds),
        storeId: order.storeId,
      },
    });

    for (const item of order.items) {
      const stock = stocks.find((s) => s.productId === item.product.id);
      if (stock) {
        stock.reserved = Math.max(
          0,
          Number(stock.reserved) - Number(item.quantity),
        );
      }
    }

    if (stocks.length > 0) {
      await this.stockRepository.save(stocks);
    }
  }
}
