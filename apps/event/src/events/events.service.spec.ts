import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventsService } from './events.service';
import { Event, EventDocument } from '../schemas/event.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MockEventData } from '@app/testing';

describe('EventsService', () => {
  let service: EventsService;
  let model: Model<EventDocument>;

  const mockEventModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    constructor: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    model = module.get<Model<EventDocument>>(getModelToken(Event.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a paginated list of events', async () => {
      const mockEvents = MockEventData.events;
      const mockTotalCount = mockEvents.length;

      mockEventModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEvents),
      });

      mockEventModel.countDocuments.mockResolvedValue(mockTotalCount);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items', mockEvents);
      expect(result.meta).toHaveProperty('total', mockTotalCount);
      expect(mockEventModel.find).toHaveBeenCalled();
      expect(mockEventModel.countDocuments).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an event if found', async () => {
      const mockEvent = MockEventData.events[0];

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      const result = await service.findById(mockEvent._id);

      expect(result).toEqual(mockEvent);
      expect(mockEventModel.findById).toHaveBeenCalledWith(mockEvent._id);
    });

    it('should throw NotFoundException if event not found', async () => {
      // Use a valid ObjectId format but non-existent ID
      const validObjectId = new Types.ObjectId().toString();

      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if ID is invalid', async () => {
      // Mock the isValid function to return false
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);

      await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create and return a new event', async () => {
      const createEventDto = {
        title: '새 이벤트',
        description: '새 이벤트 설명',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        isActive: true,
        requiresApproval: false,
        conditionType: 'TEST',
        conditionValue: 1,
        conditionDescription: '테스트 조건',
      };

      const mockNewEvent = {
        ...createEventDto,
        _id: 'new-id',
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        save: jest.fn().mockResolvedValue({
          ...createEventDto,
          _id: 'new-id',
          startDate: new Date(createEventDto.startDate),
          endDate: new Date(createEventDto.endDate),
        }),
      };

      // Mock the constructor
      mockEventModel.constructor.mockImplementationOnce(() => mockNewEvent);

      // Using a workaround since we can't spy directly on a private property
      const originalEventModel = (service as any).eventModel;
      (service as any).eventModel = jest.fn().mockReturnValue(mockNewEvent);

      const result = await service.create(createEventDto);

      // Restore original eventModel after test
      (service as any).eventModel = originalEventModel;

      expect(result).toHaveProperty('_id', 'new-id');
      expect(result).toHaveProperty('title', createEventDto.title);
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const createEventDto = {
        title: '잘못된 이벤트',
        description: '잘못된 날짜가 있는 이벤트',
        startDate: '2025-12-31',
        endDate: '2025-01-01', // 시작일보다 이전
        isActive: true,
        requiresApproval: false,
        conditionType: 'TEST',
        conditionValue: 1,
        conditionDescription: '테스트 조건',
      };

      await expect(service.create(createEventDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update and return the event', async () => {
      const eventId = 'valid-id';
      const updateEventDto = {
        title: '수정된 이벤트',
        isActive: false,
      };

      const mockEvent = {
        _id: eventId,
        title: '원래 이벤트',
        description: '이벤트 설명',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
      };

      const mockUpdatedEvent = {
        ...mockEvent,
        ...updateEventDto,
        updatedAt: new Date(),
      };

      // For findById (used in the method to check if event exists)
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      // For findByIdAndUpdate
      mockEventModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedEvent),
      });

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      const result = await service.update(eventId, updateEventDto);

      expect(result).toEqual(mockUpdatedEvent);
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(eventId, updateEventDto, {
        new: true,
      });
    });
  });

  describe('remove', () => {
    it('should delete the event and return success', async () => {
      const eventId = 'valid-id';

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockEventModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: eventId }),
      });

      const result = await service.remove(eventId);

      expect(result).toEqual({ deleted: true });
      expect(mockEventModel.findByIdAndDelete).toHaveBeenCalledWith(eventId);
    });

    it('should throw NotFoundException if event not found for deletion', async () => {
      const eventId = 'nonexistent-id';

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockEventModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(eventId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isEventActive', () => {
    it('should return true for active event in valid date range', async () => {
      const eventId = 'active-id';
      const now = new Date();

      const mockEvent = {
        _id: eventId,
        isActive: true,
        startDate: new Date(now.getTime() - 86400000), // 1 day ago
        endDate: new Date(now.getTime() + 86400000), // 1 day from now
      };

      // Mock findById to return an active event
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      const result = await service.isEventActive(eventId);

      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('event', mockEvent);
    });

    it('should return false for inactive event', async () => {
      const eventId = 'inactive-id';
      const now = new Date();

      const mockEvent = {
        _id: eventId,
        isActive: false, // Inactive
        startDate: new Date(now.getTime() - 86400000), // 1 day ago
        endDate: new Date(now.getTime() + 86400000), // 1 day from now
      };

      // Mock findById to return an inactive event
      mockEventModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      const result = await service.isEventActive(eventId);

      expect(result).toHaveProperty('isActive', false);
      expect(result).toHaveProperty('event', mockEvent);
    });
  });
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { EventsService } from './events.service';
// import { Event, EventDocument } from '../schemas/event.schema';
// import { BadRequestException, NotFoundException } from '@nestjs/common';
// import { MockEventData } from '@app/testing';

// describe('EventsService', () => {
//   let service: EventsService;
//   let model: Model<EventDocument>;

//   const mockEventModel = {
//     find: jest.fn(),
//     findById: jest.fn(),
//     findByIdAndUpdate: jest.fn(),
//     findByIdAndDelete: jest.fn(),
//     countDocuments: jest.fn(),
//     save: jest.fn(),
//     exec: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         EventsService,
//         {
//           provide: getModelToken(Event.name),
//           useValue: mockEventModel,
//         },
//       ],
//     }).compile();

//     service = module.get<EventsService>(EventsService);
//     model = module.get<Model<EventDocument>>(getModelToken(Event.name));
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('findAll', () => {
//     it('should return a paginated list of events', async () => {
//       mockEventModel.find.mockReturnValue({
//         sort: jest.fn().mockReturnValue({
//           skip: jest.fn().mockReturnValue({
//             limit: jest.fn().mockReturnValue({
//               exec: jest.fn().mockResolvedValue(MockEventData.events),
//             }),
//           }),
//         }),
//       });
//       mockEventModel.countDocuments.mockResolvedValue(MockEventData.events.length);

//       const result = await service.findAll({ page: 1, limit: 10 });

//       expect(result).toHaveProperty('items');
//       expect(result).toHaveProperty('meta');
//       expect(result.meta).toHaveProperty('total', MockEventData.events.length);
//       expect(mockEventModel.find).toHaveBeenCalled();
//       expect(mockEventModel.countDocuments).toHaveBeenCalled();
//     });
//   });

//   describe('findById', () => {
//     it('should return an event if found', async () => {
//       const mockEvent = MockEventData.events[0];
//       mockEventModel.findById.mockReturnValue({
//         exec: jest.fn().mockResolvedValue(mockEvent),
//       });

//       const result = await service.findById(mockEvent._id);

//       expect(result).toEqual(mockEvent);
//       expect(mockEventModel.findById).toHaveBeenCalledWith(mockEvent._id);
//     });

//     it('should throw NotFoundException if event not found', async () => {
//       // Use a valid ObjectId format but non-existent ID
//       const validObjectId = new mongoose.Types.ObjectId().toString();

//       mockEventModel.findById.mockReturnValue({
//         exec: jest.fn().mockResolvedValue(null),
//       });

//       await expect(service.findById(validObjectId)).rejects.toThrow(NotFoundException);
//     });

//     // Fix the create test
//     it('should create and return a new event', async () => {
//       const createEventDto = {
//         title: '새 이벤트',
//         description: '새 이벤트 설명',
//         startDate: '2025-01-01',
//         endDate: '2025-12-31',
//         isActive: true,
//         requiresApproval: false,
//         conditionType: 'TEST',
//         conditionValue: 1,
//         conditionDescription: '테스트 조건',
//       };

//       const mockNewEvent = {
//         ...createEventDto,
//         _id: 'new-id',
//         startDate: new Date(createEventDto.startDate),
//         endDate: new Date(createEventDto.endDate),
//         save: jest.fn().mockResolvedValue({
//           ...createEventDto,
//           _id: 'new-id',
//           startDate: new Date(createEventDto.startDate),
//           endDate: new Date(createEventDto.endDate),
//         }),
//       };

//       // Instead of spying on eventModel property
//       mockEventModel.constructor = jest.fn().mockImplementation(() => mockNewEvent);

//       const result = await service.create(createEventDto);

//       expect(result).toHaveProperty('_id', 'new-id');
//       expect(result).toHaveProperty('title', createEventDto.title);
//     });

//     it('should throw BadRequestException if ID is invalid', async () => {
//       await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
//     });
//   });

//   describe('create', () => {
//     it('should create and return a new event', async () => {
//       const createEventDto = {
//         title: '새 이벤트',
//         description: '새 이벤트 설명',
//         startDate: '2025-01-01',
//         endDate: '2025-12-31',
//         isActive: true,
//         requiresApproval: false,
//         conditionType: 'TEST',
//         conditionValue: 1,
//         conditionDescription: '테스트 조건',
//       };

//       const mockNewEvent = {
//         ...createEventDto,
//         _id: 'new-id',
//         startDate: new Date(createEventDto.startDate),
//         endDate: new Date(createEventDto.endDate),
//         save: jest.fn().mockResolvedValue({
//           ...createEventDto,
//           _id: 'new-id',
//           startDate: new Date(createEventDto.startDate),
//           endDate: new Date(createEventDto.endDate),
//         }),
//       };

//       jest.spyOn(service as any, 'eventModel').mockReturnValueOnce({
//         constructor: jest.fn().mockImplementation(() => mockNewEvent),
//       });

//       const result = await service.create(createEventDto);

//       expect(result).toHaveProperty('_id', 'new-id');
//       expect(result).toHaveProperty('title', createEventDto.title);
//     });

//     it('should throw BadRequestException if end date is before start date', async () => {
//       const createEventDto = {
//         title: '잘못된 이벤트',
//         description: '잘못된 날짜가 있는 이벤트',
//         startDate: '2025-12-31',
//         endDate: '2025-01-01', // 시작일보다 이전
//         isActive: true,
//         requiresApproval: false,
//         conditionType: 'TEST',
//         conditionValue: 1,
//         conditionDescription: '테스트 조건',
//       };

//       await expect(service.create(createEventDto)).rejects.toThrow(BadRequestException);
//     });
//   });

//   // 추가 테스트 생략
// });
