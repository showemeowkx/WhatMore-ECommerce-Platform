import { Exclude } from 'class-transformer';
import { Cart } from 'src/cart/entities/cart.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Store } from 'src/store/entities/store.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: null })
  name: string;

  @Column({ nullable: true, default: null })
  surname: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({ unique: true, nullable: true, default: null })
  email: string;

  @Column()
  imagePath: string;

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'selectedStoreId' })
  selectedStore: Store;

  @Column({ nullable: true })
  selectedStoreId: number;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  refreshToken: string | null;
}
