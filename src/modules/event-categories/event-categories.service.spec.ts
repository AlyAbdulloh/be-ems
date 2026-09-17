import { Test, TestingModule } from '@nestjs/testing';
import { EventCategoriesService } from './event-categories.service';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EventCategoriesService', () => {
  let service: EventCategoriesService;
  let prisma: EmsPrismaService;

  const mockCategory = {
    id: 'category-uuid-1',
    name: 'Music',
  };

  const mockPrismaService = {
    eventCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCategoriesService,
        {
          provide: EmsPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventCategoriesService>(EventCategoriesService);
    prisma = module.get<EmsPrismaService>(EmsPrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      mockPrismaService.eventCategory.findUnique.mockResolvedValue(null);
      mockPrismaService.eventCategory.create.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Music' });

      expect(result.data.name).toBe('Music');
    });

    it('should throw ConflictException if category name exists', async () => {
      mockPrismaService.eventCategory.findUnique.mockResolvedValue(mockCategory);

      await expect(service.create({ name: 'Music' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockPrismaService.eventCategory.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result.data.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return category by ID', async () => {
      mockPrismaService.eventCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('category-uuid-1');

      expect(result.data).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.eventCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
