import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { MachinesService } from './machines.service';
import { Roles } from '../../auth/roles.decorator';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Roles('admin')
  @Post("create-machine")
  create(@Body() dto: CreateMachineDto) {
    return this.machinesService.create(dto);
  }

  @Get("get-all-machines")
  getAllMachines() {
    return this.machinesService.getAllMachines();
  }

  @Roles('admin')
  @Patch("update-machine/:id")
  update(@Param('id') id: string, @Body() dto: UpdateMachineDto) {
    return this.machinesService.update(id, dto);
  }

  @Roles('admin')
  @Delete("delete-machine/:id")
  remove(@Param('id') id: string) {
    return this.machinesService.remove(id);
  }
}
