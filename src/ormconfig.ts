import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const config: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
}
