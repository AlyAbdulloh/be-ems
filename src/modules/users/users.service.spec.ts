import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@internal/prisma/ems';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: EmsPrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    name: 'Test User',
    role: RoleName.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: EmsPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<EmsPrismaService>(EmsPrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        roles: [{ role: { name: RoleName.ADMIN } }],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: RoleName.ADMIN,
      };

      const result = await service.create(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.data.email).toBe(dto.email);
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        select: expect.any(Object),
      });
      expect(result.data).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of users', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const query = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(result.meta.total).toBe(1);
      expect(result.data.length).toBe(1);
    });
  });
});
