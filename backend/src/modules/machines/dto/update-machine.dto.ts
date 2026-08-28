import { IsOptional, IsString } from 'class-validator';

export class UpdateMachineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  brand?: string;
}
