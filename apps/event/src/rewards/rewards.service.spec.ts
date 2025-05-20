import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RewardsService } from './rewards.service';
import { Reward, RewardDocument } from '../schemas/reward.schema';
import { EventsService } from '../events/events.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MockEventData } from '@app/testing';

describe('RewardsService', () => {
  let service: RewardsService;
  let model: Model<RewardDocument>;
  let eventsService: EventsService;

  const mockRewardModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    constructor: jest.fn(),
    exec: jest.fn(),
    save: jest.fn(),
  };

  const mockEventsService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        {
          provide: getModelToken(Reward.name),
          useValue: mockRewardModel,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    model = module.get<Model<RewardDocument>>(getModelToken(Reward.name));
    eventsService = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEventId', () => {
    it('should return rewards for a given event ID', async () => {
      const eventId = MockEventData.events[0]._id;
      const mockRewards = MockEventData.rewards.filter(r => r.eventId === eventId);

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockEventsService.findById.mockResolvedValueOnce(MockEventData.events[0]);

      mockRewardModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRewards),
      });

      const result = await service.findByEventId(eventId);

      expect(result).toEqual(mockRewards);
      expect(eventsService.findById).toHaveBeenCalledWith(eventId);
      expect(mockRewardModel.find).toHaveBeenCalled();
    });

    it('should throw BadRequestException if event ID is invalid', async () => {
      // Mock the isValid function to return false
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);

      await expect(service.findByEventId('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return a reward if found', async () => {
      const mockReward = MockEventData.rewards[0];

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockRewardModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReward),
      });

      const result = await service.findById(mockReward._id);

      expect(result).toEqual(mockReward);
      expect(mockRewardModel.findById).toHaveBeenCalledWith(mockReward._id);
    });

    it('should throw NotFoundException if reward not found', async () => {
      // Use a valid ObjectId format but non-existent ID
      const validObjectId = new Types.ObjectId().toString();

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockRewardModel.findById.mockReturnValue({
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
    it('should create and return a new reward', async () => {
      const eventId = MockEventData.events[0]._id;
      const createRewardDto = {
        name: '새 보상',
        description: '새 보상 설명',
        rewardType: 'TEST',
        rewardValue: 'test-value',
        quantity: 100,
      };

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockEventsService.findById.mockResolvedValueOnce(MockEventData.events[0]);

      const mockNewReward = {
        ...createRewardDto,
        _id: 'new-id',
        eventId: new Types.ObjectId(eventId),
        save: jest.fn().mockResolvedValue({
          ...createRewardDto,
          _id: 'new-id',
          eventId: new Types.ObjectId(eventId),
        }),
      };

      // Using a workaround since we can't spy directly on a private property
      const originalRewardModel = (service as any).rewardModel;
      (service as any).rewardModel = jest.fn().mockReturnValue(mockNewReward);

      const result = await service.create(eventId, createRewardDto);

      // Restore original rewardModel after test
      (service as any).rewardModel = originalRewardModel;

      expect(result).toHaveProperty('_id', 'new-id');
      expect(result).toHaveProperty('name', createRewardDto.name);
    });

    it('should throw BadRequestException if event ID is invalid', async () => {
      const createRewardDto = {
        name: '새 보상',
        description: '새 보상 설명',
        rewardType: 'TEST',
        rewardValue: 'test-value',
        quantity: 100,
      };

      // Mock the isValid function to return false
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValueOnce(false);

      await expect(service.create('invalid-id', createRewardDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the reward', async () => {
      const rewardId = 'valid-id';
      const updateRewardDto = {
        name: '수정된 보상',
        quantity: 50,
      };

      const mockReward = {
        _id: rewardId,
        name: '원래 보상',
        description: '보상 설명',
        rewardType: 'TEST',
        rewardValue: 'test-value',
        quantity: 100,
        eventId: 'event-id',
      };

      const mockUpdatedReward = {
        ...mockReward,
        ...updateRewardDto,
        updatedAt: new Date(),
      };

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockRewardModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedReward),
      });

      const result = await service.update(rewardId, updateRewardDto);

      expect(result).toEqual(mockUpdatedReward);
      expect(mockRewardModel.findByIdAndUpdate).toHaveBeenCalledWith(rewardId, updateRewardDto, {
        new: true,
      });
    });

    it('should throw NotFoundException if reward not found for update', async () => {
      const rewardId = 'nonexistent-id';
      const updateRewardDto = {
        name: '수정된 보상',
      };

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockRewardModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(rewardId, updateRewardDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the reward and return success', async () => {
      const rewardId = 'valid-id';

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockRewardModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: rewardId }),
      });

      const result = await service.remove(rewardId);

      expect(result).toEqual({ deleted: true });
      expect(mockRewardModel.findByIdAndDelete).toHaveBeenCalledWith(rewardId);
    });

    it('should throw NotFoundException if reward not found for deletion', async () => {
      const rewardId = 'nonexistent-id';

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockRewardModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(rewardId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('decrementQuantity', () => {
    jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

    it('should decrement quantity for limited rewards', async () => {
      const rewardId = 'limited-reward-id';
      const initialQuantity = 10;

      const mockReward = {
        _id: rewardId,
        name: '제한된 보상',
        quantity: initialQuantity,
      };

      const mockUpdatedReward = {
        ...mockReward,
        quantity: initialQuantity - 1,
      };

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      // For findById
      mockRewardModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReward),
      });

      // For findByIdAndUpdate
      mockRewardModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedReward),
      });

      const result = await service.decrementQuantity(rewardId);

      expect(result.quantity).toBe(initialQuantity - 1);
      expect(mockRewardModel.findByIdAndUpdate).toHaveBeenCalledWith(
        rewardId,
        { $inc: { quantity: -1 } },
        { new: true },
      );
    });

    it('should not decrement quantity for unlimited rewards', async () => {
      const rewardId = 'unlimited-reward-id';

      const mockReward = {
        _id: rewardId,
        name: '무제한 보상',
        quantity: -1, // Unlimited
      };

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      // For findById
      mockRewardModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReward),
      });

      const result = await service.decrementQuantity(rewardId);

      expect(result).toEqual(mockReward);
      // Should not call findByIdAndUpdate for unlimited rewards
      expect(mockRewardModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reward is depleted', async () => {
      const rewardId = 'depleted-reward-id';

      const mockReward = {
        _id: rewardId,
        name: '소진된 보상',
        quantity: 0, // Depleted
      };

      // Mock the isValid function to return true
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      // For findById
      mockRewardModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReward),
      });

      await expect(service.decrementQuantity(rewardId)).rejects.toThrow(BadRequestException);
    });
  });
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { RewardsService } from './rewards.service';
// import { Reward, RewardDocument } from '../schemas/reward.schema';
// import { EventsService } from '../events/events.service';
// import { BadRequestException, NotFoundException } from '@nestjs/common';
// import { MockEventData } from '@app/testing';

// describe('RewardsService', () => {
//   let service: RewardsService;
//   let model: Model<RewardDocument>;
//   let eventsService: EventsService;

//   const mockRewardModel = {
//     find: jest.fn(),
//     findById: jest.fn(),
//     findByIdAndUpdate: jest.fn(),
//     findByIdAndDelete: jest.fn(),
//     exec: jest.fn(),
//     save: jest.fn(),
//   };

//   const mockEventsService = {
//     findById: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         RewardsService,
//         {
//           provide: getModelToken(Reward.name),
//           useValue: mockRewardModel,
//         },
//         {
//           provide: EventsService,
//           useValue: mockEventsService,
//         },
//       ],
//     }).compile();

//     service = module.get<RewardsService>(RewardsService);
//     model = module.get<Model<RewardDocument>>(getModelToken(Reward.name));
//     eventsService = module.get<EventsService>(EventsService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('findByEventId', () => {
//     it('should return rewards for a given event ID', async () => {
//       const eventId = MockEventData.events[0]._id;
//       const mockRewards = MockEventData.rewards.filter(r => r.eventId === eventId);

//       mockEventsService.findById.mockResolvedValueOnce(MockEventData.events[0]);
//       mockRewardModel.find.mockReturnValue({
//         exec: jest.fn().mockResolvedValue(mockRewards),
//       });

//       const result = await service.findByEventId(eventId);

//       expect(result).toEqual(mockRewards);
//       expect(eventsService.findById).toHaveBeenCalledWith(eventId);
//       expect(mockRewardModel.find).toHaveBeenCalled();
//     });

//     it('should throw BadRequestException if event ID is invalid', async () => {
//       await expect(service.findByEventId('invalid-id')).rejects.toThrow(BadRequestException);
//     });
//   });

//   describe('findById', () => {
//     it('should return a reward if found', async () => {
//       const mockReward = MockEventData.rewards[0];
//       mockRewardModel.findById.mockReturnValue({
//         exec: jest.fn().mockResolvedValue(mockReward),
//       });

//       const result = await service.findById(mockReward._id);

//       expect(result).toEqual(mockReward);
//       expect(mockRewardModel.findById).toHaveBeenCalledWith(mockReward._id);
//     });

//     it('should throw NotFoundException if reward not found', async () => {
//       mockRewardModel.findById.mockReturnValue({
//         exec: jest.fn().mockResolvedValue(null),
//       });

//       await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
//     });

//     it('should throw BadRequestException if ID is invalid', async () => {
//       await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
//     });
//   });

//   describe('create', () => {
//     it('should create and return a new reward', async () => {
//       const eventId = MockEventData.events[0]._id;
//       const createRewardDto = {
//         name: '새 보상',
//         description: '새 보상 설명',
//         rewardType: 'TEST',
//         rewardValue: 'test-value',
//         quantity: 100,
//       };

//       mockEventsService.findById.mockResolvedValueOnce(MockEventData.events[0]);

//       const mockNewReward = {
//         ...createRewardDto,
//         _id: 'new-id',
//         eventId,
//         save: jest.fn().mockResolvedValue({
//           ...createRewardDto,
//           _id: 'new-id',
//           eventId,
//         }),
//       };

//       jest.spyOn(service as any, 'rewardModel').mockReturnValueOnce({
//         constructor: jest.fn().mockImplementation(() => mockNewReward),
//       });

//       const result = await service.create(eventId, createRewardDto);

//       expect(result).toHaveProperty('_id', 'new-id');
//       expect(result).toHaveProperty('name', createRewardDto.name);
//       expect(result).toHaveProperty('eventId', eventId);
//     });

//     it('should throw BadRequestException if event ID is invalid', async () => {
//       const createRewardDto = {
//         name: '새 보상',
//         description: '새 보상 설명',
//         rewardType: 'TEST',
//         rewardValue: 'test-value',
//         quantity: 100,
//       };

//       await expect(service.create('invalid-id', createRewardDto)).rejects.toThrow(
//         BadRequestException,
//       );
//     });
//   });

//   // 추가 테스트 생략
// });
