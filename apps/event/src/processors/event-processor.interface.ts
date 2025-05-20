/**
 * 이벤트 프로세서 인터페이스
 * 각 이벤트 유형의 프로세서가 구현해야 하는 인터페이스입니다.
 */
export interface EventProcessor {
  /**
   * 이벤트 처리
   *
   * @param userId 사용자 ID
   * @param eventData 이벤트 데이터
   * @param session MongoDB 세션 (트랜잭션)
   * @returns 처리 결과
   */
  process(userId: string, eventData: Record<string, any>, session?: any): Promise<any>;
}
