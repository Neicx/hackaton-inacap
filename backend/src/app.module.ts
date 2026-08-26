import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { UsersModule } from './modules/users/users.module';
import { MachinesModule } from './modules/machines/machines.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule,UsersModule,MachinesModule,TicketsModule,],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
