import { Controller, Post, Get, Body } from '@nestjs/common';
import { CreateMachineDto } from './dto/create-machine.dto';
import { MachinesService } from './machines.service';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post("create-machine")
  create(@Body() dto: CreateMachineDto) {
    return this.machinesService.create(dto);
  }

  @Get("get-all-machines")
  getAllMachines() {
    return this.machinesService.getAllMachines();
  }
}
