import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['mecanico', 'electricista', 'maquinaria', 'general'])
  specialty?: string;
}
