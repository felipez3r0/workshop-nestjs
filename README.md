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