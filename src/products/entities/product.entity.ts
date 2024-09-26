import { OrderItem } from 'src/orders/entities/orderitem.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @OneToMany(() => OrderItem, (item) => item.product)
  items: OrderItem[];
}
