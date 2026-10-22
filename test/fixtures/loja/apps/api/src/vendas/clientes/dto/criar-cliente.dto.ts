import { IsEmail, MaxLength } from 'class-validator';

export class CriarClienteDto {
  @IsEmail()
  email: string;

  @MaxLength(120)
  nome: string;
}
