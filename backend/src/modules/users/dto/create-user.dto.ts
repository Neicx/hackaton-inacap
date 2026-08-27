import { IsIn, IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['admin', 'user', 'technical'])
  role: string;

  @IsOptional()
  @IsIn(['mecanico', 'electricista', 'maquinaria', 'general'])
  specialty?: string;
}
