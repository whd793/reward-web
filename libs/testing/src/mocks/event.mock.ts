// import { RewardRequestStatus } from '../../../apps/event/src/schemas/reward-request.schema';

import { RewardRequestStatus } from '../../../../apps/event/src/schemas/reward-request.schema';
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

/**
 * 이벤트 서비스 모의 객체
 */
export const MockEventsService = {
  findAll: jest.fn().mockImplementation((paginationDto, filter = {}) => {
    return {
      items: MockEventData.events,
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
  update: jest.fn().mockImplementation((id, updateEventDto) => {
    const event = MockEventData.events.find(e => e._id === id);
    if (!event) throw new Error('Event not found');
    return { ...event, ...updateEventDto, updatedAt: new Date() };
  }),
  remove: jest.fn().mockImplementation(id => {
    const event = MockEventData.events.find(e => e._id === id);
    if (!event) throw new Error('Event not found');
    return { deleted: true };
  }),
  isEventActive: jest.fn().mockImplementation(eventId => {
    const event = MockEventData.events.find(e => e._id === eventId);
    if (!event) return { isActive: false, event: null };

    const now = new Date();
    const isActive = event.isActive && now >= event.startDate && now <= event.endDate;

    return { isActive, event };
  }),
};

/**
 * 보상 서비스 모의 객체
 */
export const MockRewardsService = {
  findByEventId: jest.fn().mockImplementation(eventId => {
    return MockEventData.rewards.filter(r => r.eventId === eventId);
  }),
  findById: jest.fn().mockImplementation(id => {
    const reward = MockEventData.rewards.find(r => r._id === id);
    if (!reward) throw new Error('Reward not found');
    return reward;
  }),
  create: jest.fn().mockImplementation((eventId, createRewardDto) => {
    const newReward = {
      _id: `mock-id-${Date.now()}`,
      ...createRewardDto,
      eventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newReward;
  }),
  update: jest.fn().mockImplementation((id, updateRewardDto) => {
    const reward = MockEventData.rewards.find(r => r._id === id);
    if (!reward) throw new Error('Reward not found');
    return { ...reward, ...updateRewardDto, updatedAt: new Date() };
  }),
  remove: jest.fn().mockImplementation(id => {
    const reward = MockEventData.rewards.find(r => r._id === id);
    if (!reward) throw new Error('Reward not found');
    return { deleted: true };
  }),
  decrementQuantity: jest.fn().mockImplementation(id => {
    const reward = MockEventData.rewards.find(r => r._id === id);
    if (!reward) throw new Error('Reward not found');

    if (reward.quantity !== -1) {
      if (reward.quantity <= 0) throw new Error('Reward quantity depleted');
      reward.quantity -= 1;
    }

    return reward;
  }),
};

/**
 * 이벤트 프로세서 서비스 모의 객체
 */
export const MockEventsProcessorService = {
  processRewardRequest: jest.fn().mockImplementation((userId, eventId, requestDto) => {
    const { isActive, event } = MockEventsService.isEventActive(eventId);

    if (!isActive || !event) {
      return {
        _id: `mock-id-${Date.now()}`,
        userId,
        eventId,
        rewardId: requestDto.rewardId,
        status: RewardRequestStatus.REJECTED,
        rejectionReason: '이벤트가 활성화되지 않았거나 존재하지 않습니다.',
        idempotencyKey: requestDto.idempotencyKey || `mock-key-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: new Date(),
      };
    }

    if (event.requiresApproval) {
      return {
        _id: `mock-id-${Date.now()}`,
        userId,
        eventId,
        rewardId: requestDto.rewardId,
        status: RewardRequestStatus.PENDING,
        idempotencyKey: requestDto.idempotencyKey || `mock-key-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      _id: `mock-id-${Date.now()}`,
      userId,
      eventId,
      rewardId: requestDto.rewardId,
      status: RewardRequestStatus.COMPLETED,
      idempotencyKey: requestDto.idempotencyKey || `mock-key-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: new Date(),
    };
  }),
  getUserRewardRequests: jest.fn().mockImplementation((userId, paginationOptions = {}) => {
    const userRequests = MockEventData.rewardRequests.filter(r => r.userId === userId);

    return {
      items: userRequests,
      meta: {
        total: userRequests.length,
        page: paginationOptions.page || 1,
        limit: paginationOptions.limit || 10,
        pages: Math.ceil(userRequests.length / (paginationOptions.limit || 10)),
      },
    };
  }),
  getAllRewardRequests: jest.fn().mockImplementation((options = {}) => {
    let requests = [...MockEventData.rewardRequests];

    if (options.status) {
      requests = requests.filter(r => r.status === options.status);
    }

    if (options.eventId) {
      requests = requests.filter(r => r.eventId === options.eventId);
    }

    if (options.userId) {
      requests = requests.filter(r => r.userId === options.userId);
    }

    return {
      items: requests,
      meta: {
        total: requests.length,
        page: options.page || 1,
        limit: options.limit || 10,
        pages: Math.ceil(requests.length / (options.limit || 10)),
      },
    };
  }),
  approveRewardRequest: jest.fn().mockImplementation(requestId => {
    const request = MockEventData.rewardRequests.find(r => r._id === requestId);
    if (!request) throw new Error('Reward request not found');

    if (request.status !== RewardRequestStatus.PENDING) {
      throw new Error(`현재 상태(${request.status})에서는 승인할 수 없습니다.`);
    }

    request.status = RewardRequestStatus.COMPLETED;
    request.processedAt = new Date();

    return request;
  }),
  rejectRewardRequest: jest.fn().mockImplementation((requestId, reason) => {
    const request = MockEventData.rewardRequests.find(r => r._id === requestId);
    if (!request) throw new Error('Reward request not found');

    if (request.status !== RewardRequestStatus.PENDING) {
      throw new Error(`현재 상태(${request.status})에서는 거부할 수 없습니다.`);
    }

    request.status = RewardRequestStatus.REJECTED;
    request.rejectionReason = reason || '운영자에 의해 거부되었습니다.';
    request.processedAt = new Date();

    return request;
  }),
  getRewardRequestById: jest.fn().mockImplementation(requestId => {
    const request = MockEventData.rewardRequests.find(r => r._id === requestId);
    if (!request) throw new Error('Reward request not found');
    return request;
  }),
};
