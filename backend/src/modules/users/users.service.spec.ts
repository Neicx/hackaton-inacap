import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hash_password, signJwt, verify_password_hashed } from '../../auth/auth.utils';
import { UsersService } from './users.service';

jest.mock('../../auth/auth.utils', () => ({
  hash_password: jest.fn(),
  verify_password_hashed: jest.fn(),
  signJwt: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('hashes a password before creating a user', async () => {
    jest.mocked(hash_password).mockResolvedValue('hashed-password');
    const createdUser = {
      id: '98cffccd-a526-4ebc-8398-ad74ac720b4b',
      name: 'Ada',
      email: 'ada@example.com',
    };
    prisma.user.create.mockResolvedValue(createdUser);

    await expect(
      service.create({ name: 'Ada', email: 'ada@example.com', password: 'password123' }),
    ).resolves.toEqual(createdUser);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Ada',
        email: 'ada@example.com',
        hashed_password: 'hashed-password',
      },
      omit: { hashed_password: true },
    });
  });

  it('queries users without password hashes', async () => {
    const users = [
      { id: '98cffccd-a526-4ebc-8398-ad74ac720b4b', name: 'Ada', email: 'ada@example.com' },
    ];
    prisma.user.findMany.mockResolvedValue(users);

    await expect(service.findAll()).resolves.toEqual(users);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      omit: { hashed_password: true },
    });
  });

  it('uses the requested id for user read, update, and delete operations', async () => {
    const user = {
      id: '98cffccd-a526-4ebc-8398-ad74ac720b4b',
      name: 'Ada',
      email: 'ada@example.com',
    };
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);
    prisma.user.delete.mockResolvedValue(user);

    await service.findOne('98cffccd-a526-4ebc-8398-ad74ac720b4b');
    await service.update('98cffccd-a526-4ebc-8398-ad74ac720b4b', { name: 'Grace' });
    await service.remove('98cffccd-a526-4ebc-8398-ad74ac720b4b');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '98cffccd-a526-4ebc-8398-ad74ac720b4b' },
      omit: { hashed_password: true },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '98cffccd-a526-4ebc-8398-ad74ac720b4b' },
      data: { name: 'Grace', email: undefined },
      omit: { hashed_password: true },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: '98cffccd-a526-4ebc-8398-ad74ac720b4b' },
      omit: { hashed_password: true },
    });
  });

  it('returns a token and password-free user for valid credentials', async () => {
    const user = {
      id: '98cffccd-a526-4ebc-8398-ad74ac720b4b',
      name: 'Ada',
      email: 'ada@example.com',
      hashed_password: 'stored-hash',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    };
    prisma.user.findUnique.mockResolvedValue(user);
    jest.mocked(verify_password_hashed).mockResolvedValue(true);
    jest.mocked(signJwt).mockReturnValue('signed-token');

    await expect(service.login({ email: user.email, password: 'password123' })).resolves.toEqual({
      jwt_token: 'signed-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });

    expect(signJwt).toHaveBeenCalledWith({ sub: user.id, email: user.email, name: user.name });
  });

  it('rejects invalid credentials without signing a token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toThrow(new UnauthorizedException('INVALID_CREDENTIALS'));

    expect(signJwt).not.toHaveBeenCalled();
  });
});
