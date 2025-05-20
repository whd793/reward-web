// apps/event/src/events/events.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { Event, EventStatus } from '../schemas/event.schema';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { EventType, PaginationDto } from '@app/common';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let mockEventModel: any;
  let mockEventLoggerService: any;

  const mockEvent = {
    _id: 'event-id',
    name: 'Test Event',
    description: 'Test Description',
    eventType: EventType.DAILY_LOGIN,
    condition: { consecutiveDays: 7 },
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: EventStatus.ACTIVE,
    createdBy: 'admin-id',
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    // Create a Jest mock function that acts as constructor
    const MockEventModel: any = jest.fn().mockImplementation((data: any) => ({
      ...mockEvent,
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockEvent, ...data }),
    }));

    // Add static methods - cast to any to avoid TypeScript errors
    (MockEventModel as any).find = jest.fn();
    (MockEventModel as any).findById = jest.fn();
    (MockEventModel as any).countDocuments = jest.fn();

    mockEventLoggerService = {
      calculateConsecutiveEvents: jest.fn(),
      getUserEventLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: MockEventModel,
        },
        {
          provide: EventLoggerService,
          useValue: mockEventLoggerService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    mockEventModel = module.get(getModelToken(Event.name));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create event successfully', async () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        eventType: EventType.DAILY_LOGIN,
        condition: { consecutiveDays: 7 },
        startDate: new Date(),
        endDate: new Date(),
        status: EventStatus.ACTIVE,
        approvalType: 'AUTO' as any,
      };

      const result = await service.create(createEventDto, 'admin-id');

      expect(mockEventModel).toHaveBeenCalledWith({
        ...createEventDto,
        createdBy: 'admin-id',
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated events', async () => {
      const mockEvents = [mockEvent];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventModel.find.mockReturnValue(mockQuery);
      mockEventModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      // Create proper PaginationDto instance
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;

      const result = await service.findAll(paginationDto);

      expect(result.data).toEqual(mockEvents);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should handle undefined pagination dto', async () => {
      const mockEvents = [mockEvent];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventModel.find.mockReturnValue(mockQuery);
      mockEventModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(undefined as any);

      expect(result.data).toEqual(mockEvents);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('findActive', () => {
    it('should return active events', async () => {
      const mockEvents = [mockEvent];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      };

      mockEventModel.find.mockReturnValue(mockQuery);
      mockEventModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      // Create proper PaginationDto instance
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;

      const result = await service.findActive(paginationDto);

      expect(mockEventModel.find).toHaveBeenCalledWith({
        status: EventStatus.ACTIVE,
        startDate: { $lte: expect.any(Date) },
        endDate: { $gte: expect.any(Date) },
      });
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('findById', () => {
    it('should return event by id', async () => {
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id format', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkEventCondition', () => {
    it('should check daily login condition', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.DAILY_LOGIN,
        condition: { consecutiveDays: 7 },
      };

      mockEventLoggerService.calculateConsecutiveEvents.mockResolvedValue(7);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(true);
      expect(mockEventLoggerService.calculateConsecutiveEvents).toHaveBeenCalledWith(
        'user-id',
        EventType.DAILY_LOGIN,
      );
    });

    it('should return false when daily login condition not met', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.DAILY_LOGIN,
        condition: { consecutiveDays: 7 },
      };

      mockEventLoggerService.calculateConsecutiveEvents.mockResolvedValue(3);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(false);
    });

    it('should check invite friends condition', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.INVITE_FRIENDS,
        condition: { friendCount: 3 },
      };

      const mockLogs = [
        { data: { invitedUserId: 'friend1' } },
        { data: { invitedUserId: 'friend2' } },
        { data: { invitedUserId: 'friend3' } },
      ];

      mockEventLoggerService.getUserEventLogs.mockResolvedValue(mockLogs);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(true);
    });

    it('should return false when invite friends condition not met', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.INVITE_FRIENDS,
        condition: { friendCount: 5 },
      };

      const mockLogs = [
        { data: { invitedUserId: 'friend1' } },
        { data: { invitedUserId: 'friend2' } },
      ];

      mockEventLoggerService.getUserEventLogs.mockResolvedValue(mockLogs);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(false);
    });

    it('should check quest complete condition', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.QUEST_COMPLETE,
        condition: { questId: 'quest_123' },
      };

      const mockLogs = [{ data: { questId: 'quest_123' } }];

      mockEventLoggerService.getUserEventLogs.mockResolvedValue(mockLogs);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(true);
    });

    it('should check level up condition', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.LEVEL_UP,
        condition: { targetLevel: 10 },
      };

      const mockLogs = [{ data: { newLevel: 15 } }];

      mockEventLoggerService.getUserEventLogs.mockResolvedValue(mockLogs);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(true);
    });

    it('should check profile complete condition', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.PROFILE_COMPLETE,
        condition: { requiredFields: ['name', 'email', 'avatar'] },
      };

      const mockLogs = [{ data: { completedFields: ['name', 'email', 'avatar', 'phone'] } }];

      mockEventLoggerService.getUserEventLogs.mockResolvedValue(mockLogs);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(true);
    });

    it('should return false for unsupported event type', async () => {
      const event = {
        ...mockEvent,
        eventType: 'UNSUPPORTED_TYPE' as any,
      };

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(false);
    });

    it('should return false when no logs exist for level up', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.LEVEL_UP,
        condition: { targetLevel: 10 },
      };

      mockEventLoggerService.getUserEventLogs.mockResolvedValue([]);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(false);
    });

    it('should return false when no logs exist for profile complete', async () => {
      const event = {
        ...mockEvent,
        eventType: EventType.PROFILE_COMPLETE,
        condition: { requiredFields: ['name', 'email'] },
      };

      mockEventLoggerService.getUserEventLogs.mockResolvedValue([]);

      const result = await service.checkEventCondition('user-id', event as any);

      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update event status', async () => {
      const mockEventToUpdate = {
        ...mockEvent,
        status: EventStatus.ACTIVE,
        save: jest.fn().mockResolvedValue({ ...mockEvent, status: EventStatus.INACTIVE }),
      };

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEventToUpdate),
      });

      const result = await service.updateStatus(
        '507f1f77bcf86cd799439011',
        EventStatus.INACTIVE,
        'admin-id',
      );

      expect(mockEventToUpdate.status).toBe(EventStatus.INACTIVE);
      expect(mockEventToUpdate.save).toHaveBeenCalled();
    });
  });

  describe('findByEventType', () => {
    it('should find events by event type', async () => {
      const mockEvents = [mockEvent];
      mockEventModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvents),
      });

      const result = await service.findByEventType(EventType.DAILY_LOGIN);

      expect(mockEventModel.find).toHaveBeenCalledWith({
        eventType: EventType.DAILY_LOGIN,
        status: EventStatus.ACTIVE,
        startDate: { $lte: expect.any(Date) },
        endDate: { $gte: expect.any(Date) },
      });
      expect(result).toEqual(mockEvents);
    });
  });
});
