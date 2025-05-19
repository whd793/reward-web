import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

/**
 * 멱등성 키 생성 유틸리티
 * 중복 처리를 방지하기 위한 멱등성 키를 생성합니다.
 */
export class IdempotencyUtil {
  /**
   * 고유한 멱등성 키 생성
   * @returns 생성된 UUID
   */
  static generateKey(): string {
    return uuidv4();
  }

  /**
   * 요청 데이터 기반 멱등성 키 생성
   * 동일한 요청에 대해 항상 동일한 키를 생성합니다.
   *
   * @param userId 사용자 ID
   * @param actionType 액션 유형
   * @param data 관련 데이터
   * @returns 요청 기반 해시 키
   */
  static generateKeyFromRequest(
    userId: string,
    actionType: string,
    data: Record<string, any>,
  ): string {
    const input = `${userId}:${actionType}:${JSON.stringify(data)}`;
    return createHash('sha256').update(input).digest('hex');
  }
}
