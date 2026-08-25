import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  const usersService = {
    login: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid login request', async () => {
    usersService.login.mockResolvedValue({ jwt_token: 'signed-token' });

    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/users/login')
      .send({ email: 'ada@example.com', password: 'password123' })
      .expect(201)
      .expect({ jwt_token: 'signed-token' });

    expect(usersService.login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123',
    });
  });

  it('rejects an invalid login request before it reaches the service', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/users/login')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(usersService.login).not.toHaveBeenCalled();
  });
});
