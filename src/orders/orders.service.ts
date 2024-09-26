import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from 'src/products/entities/product.entity';
import { OrderItem } from './entities/orderitem.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const products = await this.productsRepository.find({
      where: {
        id: In(createOrderDto.products.map((item) => item.productId)),
      },
    });

    const total = products.reduce((acc, product) => {
      const item = createOrderDto.products.find(
        (p) => p.productId === product.id,
      );
      return acc + product.price * item.quantity;
    }, 0);

    const order = this.ordersRepository.create({
      total,
      userId: createOrderDto.userId,
    });

    await this.ordersRepository.save(order);

    const items = products.map((product) => {
      const item = createOrderDto.products.find(
        (p) => p.productId === product.id,
      );
      return this.orderItemsRepository.create({
        quantity: item.quantity,
        price: product.price,
        total: product.price * item.quantity,
        orderId: order.id,
        productId: product.id,
      });
    });

    await this.orderItemsRepository.save(items);

    return order;
  }

  findAll() {
    return this.ordersRepository.find({
      relations: ['items', 'items.product', 'user'],
    });
  }
}
