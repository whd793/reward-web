import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 없거나 형식이 잘못되었습니다.');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Auth 서비스를 통해 토큰 검증
      const user = await firstValueFrom(
        this.authClient.send('validate_token', { token }).pipe(
          timeout(5000),
          catchError(err => {
            this.logger.error(`Token validation error: ${err.message}`, err.stack);
            throw new UnauthorizedException('인증 토큰이 유효하지 않습니다.');
          }),
        ),
      );

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }
}

// import {
//   Injectable,
//   ExecutionContext,
//   UnauthorizedException,
//   Inject,
//   Logger,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { ClientProxy } from '@nestjs/microservices';
// import { catchError, firstValueFrom, timeout } from 'rxjs';
// import { Reflector } from '@nestjs/core';
// import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   private readonly logger = new Logger(JwtAuthGuard.name);

//   constructor(
//     private reflector: Reflector,
//     @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
//   ) {
//     super();
//   }

//   /**
//    * 요청에 대한 인증을 수행합니다.
//    * @param context 실행 컨텍스트
//    * @returns 인증 성공 여부
//    */
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // Public 라우트 확인 (인증이 필요 없는 라우트)
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest();
//     const authHeader = request.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       throw new UnauthorizedException('인증 토큰이 없거나 형식이 잘못되었습니다.');
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//       // Auth 서비스를 통해 토큰 검증
//       const user = await firstValueFrom(
//         this.authClient.send('validate_token', { token }).pipe(
//           timeout(5000),
//           catchError(err => {
//             this.logger.error(`Token validation error: ${err.message}`, err.stack);
//             throw new UnauthorizedException('인증 토큰이 유효하지 않습니다.');
//           }),
//         ),
//       );

//       request.user = user;
//       return true;
//     } catch (error) {
//       this.logger.error(`Authentication failed: ${error.message}`, error.stack);
//       throw new UnauthorizedException('인증에 실패했습니다.');
//     }
//   }
// }

// import {
//   Injectable,
//   ExecutionContext,
//   UnauthorizedException,
//   Inject,
//   Logger,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { ClientProxy } from '@nestjs/microservices';
// import { catchError, firstValueFrom, timeout } from 'rxjs';
// import { Reflector } from '@nestjs/core';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   private readonly logger = new Logger(JwtAuthGuard.name);

//   constructor(
//     private reflector: Reflector,
//     @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
//   ) {
//     super();
//   }

//   /**
//    * 요청에 대한 인증을 수행합니다.
//    * @param context 실행 컨텍스트
//    * @returns 인증 성공 여부
//    */
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // Public 라우트 확인 (인증이 필요 없는 라우트)
//     const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest();
//     const authHeader = request.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       throw new UnauthorizedException('인증 토큰이 없거나 형식이 잘못되었습니다.');
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//       // Auth 서비스를 통해 토큰 검증
//       const user = await firstValueFrom(
//         this.authClient.send('validate_token', { token }).pipe(
//           timeout(5000),
//           catchError(err => {
//             this.logger.error(`Token validation error: ${err.message}`, err.stack);
//             throw new UnauthorizedException('인증 토큰이 유효하지 않습니다.');
//           }),
//         ),
//       );

//       request.user = user;
//       return true;
//     } catch (error) {
//       this.logger.error(`Authentication failed: ${error.message}`, error.stack);
//       throw new UnauthorizedException('인증에 실패했습니다.');
//     }
//   }
// }
