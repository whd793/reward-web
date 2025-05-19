/**
 * 사용자 역할 상수 정의
 * 각 역할은 시스템 내에서 특정 권한을 가집니다.
 */
export enum Role {
  USER = 'USER', // 일반 사용자: 보상 요청만 가능
  OPERATOR = 'OPERATOR', // 운영자: 이벤트 및 보상 관리, 승인 가능
  AUDITOR = 'AUDITOR', // 감사자: 이벤트 및 보상 이력 조회만 가능
  ADMIN = 'ADMIN', // 관리자: 모든 기능 접근 가능
}
