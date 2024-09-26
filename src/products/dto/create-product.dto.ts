import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsNumber({}, { message: 'Preço é obrigatório' })
  price: number;
}
