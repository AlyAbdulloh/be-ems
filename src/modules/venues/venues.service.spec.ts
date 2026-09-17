import { Test, TestingModule } from '@nestjs/testing';
import { VenuesService } from './venues.service';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { NotFoundException } from '@nestjs/common';
import { VenueType } from '@internal/prisma/ems';

describe('VenuesService', () => {
  let service: VenuesService;
  let prisma: EmsPrismaService;

  const mockVenue = {
    id: 'venue-uuid-1',
    name: 'Main Convention Hall',
    address: 'Jl. Sudirman No 1',
    city: 'Jakarta',
    capacity: 1000,
    type: VenueType.OFFLINE,
  };

  const mockPrismaService = {
    venue: {
      findUnique: jest.fn(),
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
        VenuesService,
        {
          provide: EmsPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
    prisma = module.get<EmsPrismaService>(EmsPrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create venue successfully', async () => {
      mockPrismaService.venue.create.mockResolvedValue(mockVenue);

      const result = await service.create({ name: 'Main Convention Hall' });

      expect(result.data.name).toBe('Main Convention Hall');
    });
  });

  describe('findAll', () => {
    it('should return paginated venues', async () => {
      mockPrismaService.venue.count.mockResolvedValue(1);
      mockPrismaService.venue.findMany.mockResolvedValue([mockVenue]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return venue by ID', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      const result = await service.findOne('venue-uuid-1');

      expect(result.data).toEqual(mockVenue);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
