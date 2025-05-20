/**
 * 이벤트 조건 인터페이스
 * 다양한 이벤트 유형에 대한 조건을 정의하는 인터페이스입니다.
 */
export interface DailyLoginCondition {
  consecutiveDays: number;
}

export interface InviteFriendsCondition {
  friendCount: number;
}

export interface QuestCompleteCondition {
  questId: string;
  questName?: string;
}

export interface LevelUpCondition {
  targetLevel: number;
}

export interface ProfileCompleteCondition {
  requiredFields: string[];
}

export interface PurchaseCondition {
  minAmount: number;
  productCategory?: string;
}

export interface AchievementCondition {
  achievementId: string;
  achievementName?: string;
}

export interface SocialShareCondition {
  platform: string[];
  contentType?: string;
}

export interface ContentCreateCondition {
  contentType: string;
  minLength?: number;
}

export interface SpecialEventCondition {
  eventCode: string;
  metadata?: Record<string, any>;
}

/**
 * 모든 조건 타입을 하나의 유니온 타입으로 정의
 */
export type EventCondition =
  | DailyLoginCondition
  | InviteFriendsCondition
  | QuestCompleteCondition
  | LevelUpCondition
  | ProfileCompleteCondition
  | PurchaseCondition
  | AchievementCondition
  | SocialShareCondition
  | ContentCreateCondition
  | SpecialEventCondition;
