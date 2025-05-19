import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 로컬 인증 가드
 * 로컬 전략을 사용한 인증을 처리하는 가드입니다.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
