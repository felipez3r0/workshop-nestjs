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
