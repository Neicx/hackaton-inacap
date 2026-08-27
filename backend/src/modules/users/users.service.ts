import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { signJwt, verify_password_hashed, hash_password } from '../../auth/auth.utils';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashed_password = await hash_password(createUserDto.password);

    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        hashed_password: hashed_password,
        role: createUserDto.role,
        specialty: createUserDto.specialty || null,
      },
      omit: {
        hashed_password: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      omit: { hashed_password: true },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
      omit: { hashed_password: true },
    });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        email: dto.email,
        specialty: dto.specialty,
      },
      omit: { hashed_password: true },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: {
        id,
      },
      omit: { hashed_password: true },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user || !(await verify_password_hashed(user.hashed_password, dto.password))) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const jwt_token = signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      specialty: user.specialty,
    });

    return {
      jwt_token: jwt_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }
}
