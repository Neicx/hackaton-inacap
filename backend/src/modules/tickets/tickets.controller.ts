import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

  @Roles('admin', 'technical')
  @Get('get-ticket-by-id/:id')
  getTicketById(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Post('create-ticket')
  createTicket(@Body() dto: CreateTicketDto) {
    return this.ticketsService.createTicket(dto);
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
