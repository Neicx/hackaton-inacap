import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { NoAuthRequired } from './auth/no-auth-required.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @NoAuthRequired()
  getHello(): string {
    return this.appService.getHello();
  }
}
