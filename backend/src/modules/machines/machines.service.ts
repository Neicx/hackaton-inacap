import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createMachineDto: CreateMachineDto){
        return this.prisma.machine.create({
            data:{
                name: createMachineDto.name,
                type: createMachineDto.type,
                brand: createMachineDto.brand,
            },
        });
    }

    async getAllMachines(){
        return this.prisma.machine.findMany({
            include: {
                _count: { select: { tickets: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async update(id: string, updateMachineDto: UpdateMachineDto){
        const existing = await this.prisma.machine.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Máquina no encontrada');
        return this.prisma.machine.update({
            where: { id },
            data: updateMachineDto,
        });
    }

    async remove(id: string){
        const existing = await this.prisma.machine.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Máquina no encontrada');
        const count = await this.prisma.ticket.count({ where: { machine_id: id } });
        if (count > 0) throw new NotFoundException('No se puede eliminar: la máquina tiene tickets asociados');
        return this.prisma.machine.delete({ where: { id } });
    }
}
