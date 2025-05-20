import { Connection } from 'mongoose';
import { Logger } from '@nestjs/common';

/**
 * 트랜잭션 유틸리티
 * MongoDB 트랜잭션을 쉽게 관리하기 위한 유틸리티 함수들입니다.
 */
export class TransactionUtil {
  private static readonly logger = new Logger('TransactionUtil');

  /**
   * 트랜잭션 내에서 작업을 실행합니다.
   *
   * @param connection Mongoose 연결 객체
   * @param callback 트랜잭션 내에서 실행할 비동기 콜백 함수
   * @returns 콜백 함수의 결과
   */
  static async withTransaction<T>(
    connection: Connection,
    callback: (session: any) => Promise<T>,
  ): Promise<T> {
    const session = await connection.startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      this.logger.error(`Transaction failed: ${error.message}`, error.stack);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
