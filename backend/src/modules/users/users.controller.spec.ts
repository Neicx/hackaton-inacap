import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('delegates CRUD requests to the users service', async () => {
    const user = {
      id: '98cffccd-a526-4ebc-8398-ad74ac720b4b',
      name: 'Ada',
      email: 'ada@example.com',
    };
    usersService.create.mockResolvedValue(user);
    usersService.findAll.mockResolvedValue([user]);
    usersService.findOne.mockResolvedValue(user);
    usersService.update.mockResolvedValue(user);
    usersService.remove.mockResolvedValue(user);

    await expect(
      controller.create({ name: 'Ada', email: 'ada@example.com', password: 'password123' }),
    ).resolves.toEqual(user);
    await expect(controller.findAll()).resolves.toEqual([user]);
    await expect(controller.findOne(user.id)).resolves.toEqual(user);
    await expect(controller.update(user.id, { name: 'Grace' })).resolves.toEqual(user);
    await expect(controller.remove(user.id)).resolves.toEqual(user);

    expect(usersService.create).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
    });
    expect(usersService.findAll).toHaveBeenCalledWith();
    expect(usersService.findOne).toHaveBeenCalledWith(user.id);
    expect(usersService.update).toHaveBeenCalledWith(user.id, { name: 'Grace' });
    expect(usersService.remove).toHaveBeenCalledWith(user.id);
  });

  it('delegates login requests to the users service', async () => {
    const result = {
      jwt_token: 'signed-token',
      user: { id: '98cffccd-a526-4ebc-8398-ad74ac720b4b' },
    };
    usersService.login.mockResolvedValue(result);

    await expect(
      controller.login({ email: 'ada@example.com', password: 'password123' }),
    ).resolves.toEqual(result);

    expect(usersService.login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123',
    });
  });
});
