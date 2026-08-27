import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  getAllTickets() {
    return this.prisma.ticket.findMany({
      include: {
        created_by: {
          select: { id: true, name: true, email: true },
        },
        assigned_to: {
          select: { id: true, name: true, email: true },
        },
        machine: true,
      },
    });
  }

  getTicketById(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        created_by: {
          select: { id: true, name: true, email: true },
        },
        assigned_to: {
          select: { id: true, name: true, email: true },
        },
        machine: true,
      },
    });
  }

  createTicket(dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: dto,
      include: {
        created_by: true,
        assigned_to: true,
        machine: true,
      },
    });
  }

  updateTicket(id: string, dto: UpdateTicketDto) {
    return this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: {
        created_by: true,
        assigned_to: true,
        machine: true,
      },
    });
  }

  deleteTicket(id: string) {
    return this.prisma.ticket.delete({
      where: { id },
    });
  }
}
