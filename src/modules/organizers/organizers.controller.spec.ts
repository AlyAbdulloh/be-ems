import { Test, TestingModule } from '@nestjs/testing';
import { OrganizersController } from './organizers.controller';
import { OrganizersService } from './organizers.service';
import { OrganizerStatus } from '@internal/prisma/ems';

describe('OrganizersController', () => {
  let controller: OrganizersController;
  let service: OrganizersService;

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

  const mockOrganizersService = {
    apply: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizersController],
      providers: [
        {
          provide: OrganizersService,
          useValue: mockOrganizersService,
        },
      ],
    }).compile();

    controller = module.get<OrganizersController>(OrganizersController);
    service = module.get<OrganizersService>(OrganizersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('apply', () => {
    it('should call organizersService.apply with current user sub', async () => {
      mockOrganizersService.apply.mockResolvedValue({
        message: 'Organizer application submitted successfully',
        data: mockOrganizer,
      });

      const user = { sub: 'user-uuid-1' };
      const dto = { organizationName: 'Tech Community' };

      const result = await controller.apply(user, dto);

      expect(service.apply).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result.data).toEqual(mockOrganizer);
    });
  });

  describe('getProfile', () => {
    it('should call organizersService.getProfile with current user sub', async () => {
      mockOrganizersService.getProfile.mockResolvedValue({
        message: 'Organizer profile fetched successfully',
        data: mockOrganizer,
      });

      const user = { sub: 'user-uuid-1' };
      const result = await controller.getProfile(user);

      expect(service.getProfile).toHaveBeenCalledWith('user-uuid-1');
      expect(result.data).toEqual(mockOrganizer);
    });
  });

  describe('updateProfile', () => {
    it('should call organizersService.updateProfile', async () => {
      mockOrganizersService.updateProfile.mockResolvedValue({
        message: 'Organizer profile updated successfully',
        data: mockOrganizer,
      });

      const user = { sub: 'user-uuid-1' };
      const dto = { organizationName: 'Updated Tech Community' };

      const result = await controller.updateProfile(user, dto);

      expect(service.updateProfile).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result.data).toEqual(mockOrganizer);
    });
  });

  describe('findAll', () => {
    it('should call organizersService.findAll', async () => {
      mockOrganizersService.findAll.mockResolvedValue({
        message: 'Organizers fetched successfully',
        data: [mockOrganizer],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const query = { page: 1, limit: 10 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.data.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should call organizersService.findOne', async () => {
      mockOrganizersService.findOne.mockResolvedValue({
        message: 'Organizer fetched successfully',
        data: mockOrganizer,
      });

      const result = await controller.findOne('organizer-uuid-1');

      expect(service.findOne).toHaveBeenCalledWith('organizer-uuid-1');
      expect(result.data).toEqual(mockOrganizer);
    });
  });

  describe('updateStatus', () => {
    it('should call organizersService.updateStatus', async () => {
      mockOrganizersService.updateStatus.mockResolvedValue({
        message: 'Organizer status successfully updated to APPROVED',
        data: { ...mockOrganizer, status: OrganizerStatus.APPROVED },
      });

      const dto = { status: OrganizerStatus.APPROVED };
      const result = await controller.updateStatus('organizer-uuid-1', dto);

      expect(service.updateStatus).toHaveBeenCalledWith(
        'organizer-uuid-1',
        dto,
      );
      expect(result.data.status).toBe(OrganizerStatus.APPROVED);
    });
  });
});
