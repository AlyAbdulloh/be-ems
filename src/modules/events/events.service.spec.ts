import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EmsPrismaService } from '../../prisma/ems-prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventStatus, OrganizerStatus } from '@internal/prisma/ems';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: EmsPrismaService;

  const mockApprovedOrganizer = {
    id: 'organizer-uuid-1',
    userId: 'user-uuid-1',
    organizationName: 'Tech Community',
    status: OrganizerStatus.APPROVED,
  };

  const mockEvent = {
    id: 'event-uuid-1',
    organizerId: 'organizer-uuid-1',
    title: 'Tech Summit 2026',
    slug: 'tech-summit-2026-abc12',
    startDatetime: new Date('2026-10-15T09:00:00Z'),
    endDatetime: new Date('2026-10-15T17:00:00Z'),
    status: EventStatus.DRAFT,
  };

  const mockPrismaService = {
    organizer: {
      findUnique: jest.fn(),
    },
    event: {
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
        EventsService,
        {
          provide: EmsPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<EmsPrismaService>(EmsPrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create event successfully for approved organizer', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue(
        mockApprovedOrganizer,
      );
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const dto = {
        title: 'Tech Summit 2026',
        startDatetime: '2026-10-15T09:00:00Z',
        endDatetime: '2026-10-15T17:00:00Z',
      };

      const result = await service.create('user-uuid-1', dto);

      expect(result.data.title).toBe('Tech Summit 2026');
    });

    it('should throw ForbiddenException if organizer is not approved', async () => {
      mockPrismaService.organizer.findUnique.mockResolvedValue({
        ...mockApprovedOrganizer,
        status: OrganizerStatus.PENDING,
      });

      const dto = {
        title: 'Tech Summit 2026',
        startDatetime: '2026-10-15T09:00:00Z',
        endDatetime: '2026-10-15T17:00:00Z',
      };

      await expect(service.create('user-uuid-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return event details', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne('event-uuid-1');

      expect(result.data).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
