import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

export interface TicketActor {
  sub: string;
  name?: string;
  email?: string;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private async recordHistory(
    ticketId: string,
    action: string,
    description: string,
    actor?: TicketActor,
    ticketName?: string | null,
    ticketMachine?: string | null,
  ) {
    await this.prisma.ticketHistory.create({
      data: {
        ticket_id: ticketId,
        action,
        description,
        actor_id: actor?.sub ?? null,
        actor_name: actor?.name ?? null,
        ticket_name: ticketName ?? null,
        ticket_machine: ticketMachine ?? null,
      },
    });
  }

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

  createTicket(dto: CreateTicketDto, actor?: TicketActor) {
    return this.prisma.ticket
      .create({
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
      })
      .then(async (ticket) => {
        const machineName = ticket.machine?.name ?? dto.machine_id;
        await this.recordHistory(
          ticket.id,
          'create',
          `Ticket creado para la máquina ${machineName}`,
          {
            sub: actor?.sub ?? dto.created_by_id,
            name: actor?.name,
          },
          ticket.name,
          machineName,
        );
        return ticket;
      });
  }

  async assignTicket(id: string, assignedToId: string, actor?: TicketActor) {
    const assignedTo = await this.prisma.user.findFirst({
      where: { id: assignedToId },
      select: { name: true },
    });

    const ticket = await this.prisma.ticket.update({
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

    const technicianName = assignedTo?.name ?? assignedToId;
    await this.recordHistory(
      id,
      'assign',
      `Ticket asignado al técnico ${technicianName}`,
      actor,
      ticket.name,
      ticket.machine?.name,
    );

    return ticket;
  }

  async updateTicket(id: string, dto: UpdateTicketDto, actor?: TicketActor) {
    const previous = await this.prisma.ticket.findUnique({ where: { id } });

    const ticket = await this.prisma.ticket.update({
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

    const changes: string[] = [];
    if (previous && dto.status && dto.status !== previous.status) {
      changes.push(`estado: ${previous.status} → ${dto.status}`);
    }
    if (previous && dto.priority !== undefined && dto.priority !== previous.priority) {
      changes.push(`prioridad: ${previous.priority} → ${dto.priority}`);
    }
    if (previous && dto.name && dto.name !== previous.name) {
      changes.push('título actualizado');
    }
    if (previous && dto.description && dto.description !== previous.description) {
      changes.push('descripción actualizada');
    }
    if (previous && dto.machine_id && dto.machine_id !== previous.machine_id) {
      changes.push('máquina actualizada');
    }

    await this.recordHistory(
      id,
      'update',
      changes.length > 0
        ? `Ticket actualizado: ${changes.join('; ')}`
        : 'Ticket actualizado',
      actor,
      ticket.name,
      ticket.machine?.name,
    );

    return ticket;
  }

  async deleteTicket(id: string, actor?: TicketActor) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { machine: true },
    });

    if (ticket) {
      await this.recordHistory(
        id,
        'delete',
        `Ticket eliminado (${ticket.machine?.name ?? 'sin máquina'})`,
        actor,
        ticket.name,
        ticket.machine?.name,
      );
    }

    return this.prisma.ticket.deleteMany({
      where: { id },
    });
  }

  getTicketHistory() {
    return this.prisma.ticketHistory.findMany({
      include: {
        ticket: {
          select: {
            id: true,
            name: true,
            machine: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
