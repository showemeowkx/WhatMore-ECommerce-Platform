import { User } from 'src/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Store } from 'src/store/entities/store.entity';

export enum OrderStatus {
  CANCELLED = 'CANCELLED',
  IN_PROCESS = 'IN PROCESS',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  orderNumber: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ nullable: true })
  storeId: number;

  @ManyToOne(() => Store, (store) => store.orders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true })
  apartment: string;

  @Column({ type: 'enum', enum: ['CASH', 'CARD_TERMINAL'] })
  paymentMethod: string;

  @Column({ nullable: true })
  comment: string;

  @Column('enum', { enum: OrderStatus })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
