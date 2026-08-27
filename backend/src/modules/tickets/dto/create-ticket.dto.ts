import { IsInt, IsString, IsUUID, IsOptional, Min, Max, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  priority!: number;

  @IsIn(['pendiente', 'en_progreso', 'resuelto', 'cerrado'])
  @IsOptional()
  status?: string;

  @IsString()
  description!: string;

  @IsUUID()
  created_by_id!: string;

  @IsOptional()
  @IsUUID()
  assigned_to_id?: string;

  @IsUUID()
  machine_id!: string;
}
