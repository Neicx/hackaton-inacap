import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NoAuthRequired } from '../../auth/no-auth-required.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @NoAuthRequired()
  @Post('create-user')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles('admin')
  @Get('get-technicians')
  getTechnicians() {
    return this.usersService.getTechnicians();
  }


  @Roles('admin','technical')
  @Get('get-all-users')
  findAll() {
    return this.usersService.findAll();
  }

  @Roles('admin','technical')
  @Get('get-user-by-id/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('update-user-by-id/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Roles('admin','technical')
  @Delete('delete-user-by-id/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @NoAuthRequired()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }
}
