import { IsInt, IsString, IsUUID, IsOptional, Min, Max, IsIn } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsIn(['pendiente', 'en_progreso', 'resuelto', 'cerrado'])
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigned_to_id?: string;

  @IsOptional()
  @IsUUID()
  machine_id?: string;
}
