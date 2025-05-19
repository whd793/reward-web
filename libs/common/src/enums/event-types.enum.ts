/**
 * 이벤트 유형 열거형
 * 시스템에서 지원하는 다양한 이벤트 유형을 정의합니다.
 */
export enum EventType {
  DAILY_LOGIN = 'DAILY_LOGIN', // 일일 로그인
  INVITE_FRIENDS = 'INVITE_FRIENDS', // 친구 초대
  QUEST_COMPLETE = 'QUEST_COMPLETE', // 퀘스트 완료
  LEVEL_UP = 'LEVEL_UP', // 레벨업
  PROFILE_COMPLETE = 'PROFILE_COMPLETE', // 프로필 완성
  PURCHASE = 'PURCHASE', // 구매 완료
  ACHIEVEMENT = 'ACHIEVEMENT', // 업적 달성
  SOCIAL_SHARE = 'SOCIAL_SHARE', // 소셜 공유
  CONTENT_CREATE = 'CONTENT_CREATE', // 컨텐츠 제작
  SPECIAL_EVENT = 'SPECIAL_EVENT', // 특별 이벤트
}
