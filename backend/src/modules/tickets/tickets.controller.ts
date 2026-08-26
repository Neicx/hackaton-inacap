import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('get-all-tickets')
  getAllTickets() {
    return this.ticketsService.getAllTickets();
  }

  @Get('get-ticket-by-id/:id')
  getTicketById(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Post('create-ticket')
  createTicket(@Body() ticket: any) {
    return this.ticketsService.createTicket(ticket);
  }

  @Patch('update-ticket/:id')
  updateTicket(@Param('id') id: string, @Body() ticket: any) {
    return this.ticketsService.updateTicket(id, ticket);
  }

  @Delete('delete-ticket/:id')
  deleteTicket(@Param('id') id: string) {
    return this.ticketsService.deleteTicket(id);
  }
}
