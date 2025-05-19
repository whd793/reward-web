import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 페이지네이션 DTO
 * API 요청에서 페이지네이션 파라미터를 처리하기 위한 DTO입니다.
 */
export class PaginationDto {
  @ApiProperty({
    description: '페이지 번호 (1부터 시작)',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수',
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  /**
   * 스킵할 문서 수를 계산합니다.
   * @returns 스킵할 문서 수
   */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

/**
 * 페이지네이션 응답 인터페이스
 * 페이지네이션 메타데이터를 포함한 응답 인터페이스입니다.
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

/**
 * 페이지네이션 응답 빌더
 * 페이지네이션 메타데이터를 포함한 응답을 생성합니다.
 *
 * @param items 항목 배열
 * @param totalItems 전체 항목 수
 * @param page 현재 페이지 번호
 * @param limit 페이지당 항목 수
 * @returns 페이지네이션 응답 객체
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    meta: {
      totalItems,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    },
  };
}
