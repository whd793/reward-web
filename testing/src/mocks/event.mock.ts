// Fix the import path - adjust this to match your actual project structure
import { RewardRequestStatus } from '../../../apps/event/src/schemas/reward-request.schema';

/**
 * 이벤트 관련 모의(Mock) 데이터
 * 테스트 시 사용할 더미 데이터를 제공합니다.
 */
export const MockEventData = {
  events: [
    {
      _id: '60d21b4667d0d8992e610c85',
      title: '테스트 이벤트 1',
      description: '테스트 이벤트 설명 1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      requiresApproval: false,
      conditionType: 'DAILY_LOGIN',
      conditionValue: 7,
      conditionDescription: '7일 연속 로그인',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '60d21b4667d0d8992e610c86',
      title: '테스트 이벤트 2',
      description: '테스트 이벤트 설명 2',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      requiresApproval: true,
      conditionType: 'INVITE_FRIENDS',
      conditionValue: 3,
      conditionDescription: '3명의 친구 초대',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  rewards: [
    {
      _id: '60d21b4667d0d8992e610c87',
      name: '테스트 보상 1',
      description: '테스트 보상 설명 1',
      rewardType: 'GAME_CURRENCY',
      rewardValue: 1000,
      quantity: -1,
      eventId: '60d21b4667d0d8992e610c85',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '60d21b4667d0d8992e610c88',
      name: '테스트 보상 2',
      description: '테스트 보상 설명 2',
      rewardType: 'ITEM',
      rewardValue: 'test_item',
      quantity: 100,
      eventId: '60d21b4667d0d8992e610c86',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  rewardRequests: [
    {
      _id: '60d21b4667d0d8992e610c89',
      userId: 'test-user-id',
      eventId: '60d21b4667d0d8992e610c85',
      rewardId: '60d21b4667d0d8992e610c87',
      status: RewardRequestStatus.COMPLETED,
      idempotencyKey: 'test-key-1',
      rejectionReason: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    },
    {
      _id: '60d21b4667d0d8992e610c90',
      userId: 'test-user-id',
      eventId: '60d21b4667d0d8992e610c86',
      rewardId: '60d21b4667d0d8992e610c88',
      status: RewardRequestStatus.PENDING,
      idempotencyKey: 'test-key-2',
      rejectionReason: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

// Simplified mock services - keep the rest of your existing mock services but ensure they're consistent with your actual service methods
export const MockEventsService = {
  findAll: jest.fn().mockImplementation((paginationDto = {}, filter = {}) => {
    return {
      data: MockEventData.events, // Changed from 'items' to 'data' to match your controller
      meta: {
        total: MockEventData.events.length,
        page: paginationDto.page || 1,
        limit: paginationDto.limit || 10,
        pages: Math.ceil(MockEventData.events.length / (paginationDto.limit || 10)),
      },
    };
  }),

  findById: jest.fn().mockImplementation(id => {
    const event = MockEventData.events.find(e => e._id === id);
    if (!event) throw new Error('Event not found');
    return event;
  }),

  // Add other methods as needed...
  create: jest.fn().mockImplementation(createEventDto => {
    const newEvent = {
      _id: `mock-id-${Date.now()}`,
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newEvent;
  }),

  isEventActive: jest.fn().mockImplementation(eventId => {
    const event = MockEventData.events.find(e => e._id === eventId);
    if (!event) return { isActive: false, event: null };

    const now = new Date();
    const isActive = event.isActive && now >= event.startDate && now <= event.endDate;

    return { isActive, event };
  }),
};

// Keep the rest of your mock services but ensure method names match your actual services
export const MockRewardsService = {
  findByEventId: jest.fn().mockImplementation(eventId => {
    return MockEventData.rewards.filter(r => r.eventId === eventId);
  }),

  findById: jest.fn().mockImplementation(id => {
    const reward = MockEventData.rewards.find(r => r._id === id);
    if (!reward) throw new Error('Reward not found');
    return reward;
  }),

  // Add other methods as needed...
};

// Keep your existing MockEventsProcessorService as it looks correct
export const MockEventsProcessorService = {
  // ... your existing implementation
};
