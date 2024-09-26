# Projeto Exemplo - NESTJS

## Configuração inicial do Nest
```bash
npm i -g @nestjs/cli
nest new nome-projeto
```

## Testar o projeto
```bash
cd nome-projeto
npm run start
```

Durante o desenvolvimento vamos utilizar o comando:
```bash
npm run start:dev
```

na pasta "src" temos uma série de arquivos:

- app.controller.spec.ts (arquivo de teste)
- app.controller.ts (arquivo de controle)
- app.module.ts (arquivo de configuração do módulo)
- app.service.ts (arquivo de serviço)
- main.ts (arquivo principal)

O main.ts é o arquivo que inicializa o nosso projeto e fica ouvindo as requisições na porta 3000, app.listen(3000).

Por padrão o NestJS utiliza ; no final das linhas (você pode configurar para não utilizar, mas ao gerar código com o CLI ele vai adicionar).

## Cadastro de Usuários

Vamos criar um módulo de usuários, para isso vamos criar um módulo de usuários e um serviço de usuários.

```bash
nest g res users --no-spec
```

Escolhemos a opção REST API e o CRUD entry points como Y. Esse comando cria um módulo de usuários, um controlador de usuários e um serviço de usuários. O -g é um atalho para generate, o res é um atalho para resource e o --no-spec é para não criar o arquivo de teste.

Vamos importar esse módulo no app.module.ts.

```typescript
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService],
});
```

## TypeORM e SQLite

Vamos instalar o TypeORM e o SQLite.

```bash
npm i @nestjs/typeorm typeorm sqlite3
```

Agora vamos criar um arquivo de configuração do TypeORM em um arquivo chamado ormconfig.ts

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const config: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
};
```

Vamos importar o TypeORM no app.module.ts

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from './ormconfig';

@Module({
  imports: [TypeOrmModule.forRoot(config), UsersModule],
  controllers: [AppController],
  providers: [AppService],
});
```

Vamos ajustar nossa entidade de usuário em src/users/user.entity.ts

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}
```

Vamos configurar nosso DTO em src/users/dto/create-user.dto.ts

```typescript
export class CreateUserDto {
  name: string;
  email: string;
}
```

Agora vamos ajustar o nosso serviço de usuários em src/users/users.service.ts

```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }
```

Vamos adicionar o UserRepository no nosso módulo de usuários em src/users/users.module.ts

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
```

Podemos ajustar também a rota de listar usuários no serviço de usuários em src/users/users.service.ts

```typescript
findAll() {
  return this.usersRepository.find();
}
```

Com isso já é possível criar usuários e listar usuários (lembrando que não temos tratamento de erros e validações até aqui).

## Validação de Dados

Vamos instalar o pacote class-validator para fazer a validação dos dados.

```bash
npm i class-validator class-transformer
```

Para a validação vamos utilizar o ValidationPipe do NestJS. Vamos configurar o ValidationPipe no main.ts

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // transforma os dados de entrada para o tipo correto
    whitelist: true, // remove campos que não estão no DTO
    forbidNonWhitelisted: true, // retorna erro se tiver campos que não estão no DTO
  }));
  await app.listen(3000);
}

bootstrap();
```

Agora vamos ajustar o DTO de criação de usuário em src/users/dto/create-user.dto.ts

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}
```

Com essa configuração o NestJS vai validar os dados de entrada antes de chamar o método create do serviço de usuários.

## Implementando o update e delete

Vamos implementar o update e o delete no nosso serviço de usuários em src/users/users.service.ts

```typescript
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.usersRepository.remove(user);
  }
```

Vamos criar o DTO de atualização de usuário em src/users/dto/update-user.dto.ts

```typescript
import { PartialType } from '@nestjs/mapped-types'; // importar o PartialType para criar um DTO parcial
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {} 
```

Vamos conferir o controlador de usuários em src/users/users.controller.ts e caso necessário ajustar o método update e remove.

```typescript
@Put(':id')
update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  return this.usersService.update(+id, updateUserDto);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.usersService.remove(+id);
}
```

## Criando uma entidade de produtos e pedidos

Vamos criar uma entidade de produtos para exemplificar o relacionamento entre entidades.

```bash
nest g resource products --no-spec
# escolher a opção REST API e o CRUD entry points como Y
nest g resource orders --no-spec
# escolher a opção REST API e o CRUD entry points como n
```

Vamos ajustar a entidade de produtos em src/products/product.entity.ts

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;
}
```

Vamos aproveitar para configurar a entidade de pedidos em src/orders/entities/order.entity.ts e a entidade de itens do pedido em src/orders/entities/orderitem.entity.ts

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './orderitem.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  total: number;

  @Column()
  userId: number;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

```typescript
import { Product } from 'src/products/entities/product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @Column()
  price: number;

  @Column()
  total: number;

  @Column()
  orderId: number;

  @Column()
  productId: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.items)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
```

Precisamos ajustar a entidade de produtos em src/products/product.entity.ts para que ela tenha um relacionamento com a entidade de itens do pedido.

```typescript
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
```

Vamos adicionar no user.entity.ts um relacionamento com a entidade de pedidos.

```typescript
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
```

E no order.entity.ts vamos adicionar o relacionamento com a entidade de usuários.

```typescript
  @ManyToOne(() => User, (user) => user.orders)
  user: User;
```

Vamos iniciar permitindo o cadastro de produtos, para isso vamos ajustar o service de produtos em src/products/products.service.ts

```typescript
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  create(createProductDto: CreateProductDto) {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }
```

Vamos ajustar também o product.module em src/products/products.module.ts

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
```

Para lidar com a validação do cadastro de produtos vamos ajustar o DTO em src/products/dto/create-product.dto.ts

```typescript
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsNumber({}, { message: 'Preço é obrigatório' })
  price: number;
}
```

Agora com o produto e usuário cadastrado podemos criar um pedido. Vamos ajustar o service de pedidos em src/orders/orders.service.ts

```typescript
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  create(createOrderDto: CreateOrderDto) {
    const order = this.ordersRepository.create(createOrderDto);
    return this.ordersRepository.save(order);
  }
```

Vamos ajustar o order.module em src/orders/orders.module.ts

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
```

Vamos ajustar os DTOs de criação de pedidos em src/orders/dto/create-order.dto.ts

```typescript
import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  products: CreateOrderItemDto[];

  @IsNumber({}, { message: 'Usuário é obrigatório' })
  userId: number;
}

export class CreateOrderItemDto {
  @IsNumber({}, { message: 'Quantidade é obrigatória' })
  quantity: number;

  @IsNumber({}, { message: 'Produto é obrigatório' })
  productId: number;
}
```

Agora podemos ajustar o service de pedidos em src/orders/orders.service.ts para que ele crie o pedido e seus itens.

```typescript
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
  }
}
```

Vamos ajustar o controlador de pedidos em src/orders/orders.controller.ts

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }
}
```

E agora precisamos ajustar o orders.module em src/orders/orders.module.ts

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
```

Podemos criar agora a rota de listar os pedidos em src/orders/orders.service.ts

```typescript
findAll() {
  return this.ordersRepository.find({
    relations: ['items', 'items.product', 'user'],
  });
}
```

E precisamos ajustar o controlador de pedidos em src/orders/orders.controller.ts

```typescript
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }
```