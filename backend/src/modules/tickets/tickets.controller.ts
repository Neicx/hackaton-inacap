import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Roles('admin', 'technical')
  @Get('get-all-tickets')
  getAllTickets() {
    return this.ticketsService.getAllTickets();
  }

  @Roles('admin')
  @Get('get-pending-tickets')
  getPendingTickets() {
    return this.ticketsService.getPendingTickets();
  }

  @Get('get-my-created-tickets')
  getMyCreatedTickets(@Request() req: any) {
    return this.ticketsService.getMyCreatedTickets(req.user.sub);
  }

  @Roles('admin', 'technical')
  @Get('get-ticket-by-id/:id')
  getTicketById(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Post('create-ticket')
  createTicket(@Body() dto: CreateTicketDto) {
    return this.ticketsService.createTicket(dto);
  }

  @Roles('admin')
  @Patch('assign-ticket/:id')
  assignTicket(@Param('id') id: string, @Body() body: { assigned_to_id: string }) {
    return this.ticketsService.assignTicket(id, body.assigned_to_id);
  }

  @Roles('admin', 'technical')
  @Patch('update-ticket/:id')
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.updateTicket(id, dto);
  }

  @Roles('admin')
  @Delete('delete-ticket/:id')
  deleteTicket(@Param('id') id: string) {
    return this.ticketsService.deleteTicket(id);
  }
}
