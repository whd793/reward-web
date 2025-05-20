import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * 멱등성(Idempotency) 유틸리티
 * 요청의 멱등성을 보장하기 위한 유틸리티 함수들을 제공합니다.
 */
@Injectable()
export class IdempotencyUtil {
  /**
   * 요청에 대한 멱등성 키를 생성합니다.
   * @param userId 사용자 ID
   * @param actionType 액션 타입 (예: 'reward_request')
   * @param resourceId 리소스 ID (예: 이벤트 ID)
   * @returns 생성된 멱등성 키
   */
  generateIdempotencyKey(userId: string, actionType: string, resourceId: string): string {
    const data = `${userId}:${actionType}:${resourceId}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * 요청 데이터를 기반으로 요청 해시를 생성합니다.
   * 동일한 요청에 대해 항상 동일한 해시가 생성됩니다.
   * @param userId 사용자 ID
   * @param actionType 액션 타입
   * @param data 요청 데이터
   * @returns 생성된 요청 해시
   */
  generateRequestHash(userId: string, actionType: string, data: any): string {
    const dataString = JSON.stringify(data);
    const hashData = `${userId}:${actionType}:${dataString}`;
    return createHash('sha256').update(hashData).digest('hex');
  }
}
