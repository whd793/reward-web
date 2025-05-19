/**
 * 보상 유형 열거형
 * 시스템에서 지원하는 다양한 보상 유형을 정의합니다.
 */
export enum RewardType {
  POINTS = 'POINTS', // 포인트
  ITEM = 'ITEM', // 아이템
  COUPON = 'COUPON', // 쿠폰
  CURRENCY = 'CURRENCY', // 게임 내 화폐
  SUBSCRIPTION = 'SUBSCRIPTION', // 구독 혜택
  BADGE = 'BADGE', // 뱃지
  TITLE = 'TITLE', // 칭호
}
