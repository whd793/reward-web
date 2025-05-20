import { EventType } from '../enums/event-types.enum';

/**
 * 이벤트 데이터 인터페이스
 * 이벤트 처리 시스템에 전달되는 이벤트 데이터의 구조를 정의합니다.
 */
export interface EventData {
  userId: string;
  eventType: EventType;
  timestamp: Date;
  data: Record<string, any>;
}

/**
 * 일일 로그인 이벤트 데이터
 */
export interface DailyLoginEventData extends EventData {
  eventType: EventType.DAILY_LOGIN;
  data: {
    loginDate: Date;
    deviceInfo?: string;
  };
}

/**
 * 친구 초대 이벤트 데이터
 */
export interface InviteFriendsEventData extends EventData {
  eventType: EventType.INVITE_FRIENDS;
  data: {
    invitedUserId: string;
    invitationDate: Date;
    invitationMethod?: string;
  };
}

/**
 * 퀘스트 완료 이벤트 데이터
 */
export interface QuestCompleteEventData extends EventData {
  eventType: EventType.QUEST_COMPLETE;
  data: {
    questId: string;
    questName: string;
    completionDate: Date;
    difficulty?: string;
  };
}

/**
 * 레벨업 이벤트 데이터
 */
export interface LevelUpEventData extends EventData {
  eventType: EventType.LEVEL_UP;
  data: {
    previousLevel: number;
    newLevel: number;
    experience?: number;
  };
}

/**
 * 프로필 완성 이벤트 데이터
 */
export interface ProfileCompleteEventData extends EventData {
  eventType: EventType.PROFILE_COMPLETE;
  data: {
    completedFields: string[];
    completionDate: Date;
  };
}
