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
          select: { id: true, name: true, email: true, specialty: true },
        },
        machine: true,
      },
    });
  }

  getMyCreatedTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { created_by_id: userId },
      include: {
        machine: true,
        assigned_to: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  getMyAssignedTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { assigned_to_id: userId },
      include: {
        machine: true,
        created_by: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  getPendingTickets() {
    return this.prisma.ticket.findMany({
      where: {
        status: 'pendiente',
        assigned_to_id: null,
      },
      include: {
        created_by: {
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
          select: { id: true, name: true, email: true, specialty: true },
        },
        machine: true,
      },
    });
  }

  createTicket(dto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        name: dto.name,
        priority: dto.priority,
        status: dto.status || 'pendiente',
        description: dto.description,
        created_by_id: dto.created_by_id,
        assigned_to_id: dto.assigned_to_id,
        machine_id: dto.machine_id,
      },
      include: {
        created_by: {
          select: { id: true, name: true, email: true, role: true },
        },
        assigned_to: {
          select: { id: true, name: true, email: true, role: true, specialty: true },
        },
        machine: true,
      },
    });
  }

  assignTicket(id: string, assignedToId: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        assigned_to_id: assignedToId,
        status: 'en_progreso',
      },
      include: {
        created_by: {
          select: { id: true, name: true, email: true },
        },
        assigned_to: {
          select: { id: true, name: true, email: true, specialty: true },
        },
        machine: true,
      },
    });
  }

  updateTicket(id: string, dto: UpdateTicketDto) {
    return this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: {
        created_by: {
          select: { id: true, name: true, email: true },
        },
        assigned_to: {
          select: { id: true, name: true, email: true, specialty: true },
        },
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
