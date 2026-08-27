import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';

@Injectable()
export class MachinesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createMachineDto: CreateMachineDto){
        return this.prisma.machine.create({
            data:{
                name: createMachineDto.name,
                type: createMachineDto.type,
            },
        });
    }

    async getAllMachines(){
        return this.prisma.machine.findMany();
    }
}
