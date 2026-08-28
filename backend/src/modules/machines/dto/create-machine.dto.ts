import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMachineDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  brand?: string;
}
