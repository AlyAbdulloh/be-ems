import { Test, TestingModule } from '@nestjs/testing';
import { OrganizersService } from './organizers.service';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizerStatus } from '@internal/prisma/ems';

describe('OrganizersService', () => {
  let service: OrganizersService;
  let prisma: EmsPrismaService;

  const mockOrganizer = {
    id: 'organizer-uuid-1',
    userId: 'user-uuid-1',
    organizationName: 'Tech Community',
    description: 'Description of tech community',
    status: OrganizerStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-uuid-1',
      name: 'User One',
      email: 'user1@example.com',
    },
  };

  const mockPrismaService = {
    userRole: {
      findFirst: jest.fn(),
    },
    organizer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizersService,
        {
          provide: EmsPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrganizersService>(OrganizersService);
    prisma = module.get<EmsPrismaService>(EmsPrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('apply', () => {
    it('should create an organizer application successfully', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue(null);
      mockPrismaService.organizer.findUnique.mockResolvedValue(null);
      mockPrismaService.organizer.create.mockResolvedValue(mockOrganizer);

      const applyDto = {
        organizationName: 'Tech Community',
        description: 'Description of tech community',
      };

      const result = await service.apply('user-uuid-1', applyDto);

      expect(prisma.organizer.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
      });
      expect(prisma.organizer.create).toHaveBeenCalled();
      expect(result.data.organizationName).toBe(applyDto.organizationName);
      expect(result.data.status).toBe(OrganizerStatus.PENDING);
    });

    it('should throw ForbiddenException if user is an admin', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue({ id: 'role-1' });

      const applyDto = {
        organizationName: 'Tech Community',
      };

      await expect(service.apply('user-uuid-1', applyDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if organizer application already exists', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue(null);
      mockPrismaService.organizer.findUnique.mockResolvedValue(mockOrganizer);

      const applyDto = {
        organizationName: 'Tech Community',
      };

      await expect(service.apply('user-uuid-1', applyDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return organizer profile if found', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(mockOrganizer);

      const result = await service.getProfile('user-uuid-1');

      expect(result.data).toEqual(mockOrganizer);
    });

    it('should throw NotFoundException if organizer profile not found', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update organizer profile successfully', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(mockOrganizer);
      const updatedOrganizer = {
        ...mockOrganizer,
        organizationName: 'Tech Community Updated',
      };
      mockPrismaService.organizer.update.mockResolvedValue(updatedOrganizer);

      const updateDto = { organizationName: 'Tech Community Updated' };
      const result = await service.updateProfile('user-uuid-1', updateDto);

      expect(prisma.organizer.update).toHaveBeenCalled();
      expect(result.data.organizationName).toBe('Tech Community Updated');
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of organizers', async () => {
      mockPrismaService.organizer.count.mockResolvedValue(1);
      mockPrismaService.organizer.findMany.mockResolvedValue([mockOrganizer]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.total).toBe(1);
      expect(result.data.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return organizer by ID', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(mockOrganizer);

      const result = await service.findOne('organizer-uuid-1');

      expect(result.data).toEqual(mockOrganizer);
    });

    it('should throw NotFoundException if organizer ID not found', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status of organizer successfully', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(mockOrganizer);
      const approvedOrganizer = {
        ...mockOrganizer,
        status: OrganizerStatus.APPROVED,
      };
      mockPrismaService.organizer.update.mockResolvedValue(approvedOrganizer);

      const result = await service.updateStatus('organizer-uuid-1', {
        status: OrganizerStatus.APPROVED,
      });

      expect(result.data.status).toBe(OrganizerStatus.APPROVED);
    });
  });
});
