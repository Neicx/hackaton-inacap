import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  getAllTickets() {
    return this.prisma.ticket.findMany();
  }

  getTicketById(id: string) {
    return this.prisma.ticket.findUnique({ where: { id } });
  }

  createTicket(data: any) {
    return this.prisma.ticket.create({ data });
  }

  updateTicket(id: string, data: any) {
    return this.prisma.ticket.update({ where: { id }, data });
  }

  deleteTicket(id: string) {
    return this.prisma.ticket.delete({ where: { id } });
  }
}
