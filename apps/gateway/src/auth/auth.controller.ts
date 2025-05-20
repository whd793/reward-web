import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '사용자 등록', description: '새 사용자를 시스템에 등록합니다.' })
  @ApiResponse({ status: 201, description: '사용자가 성공적으로 등록되었습니다.' })
  @ApiResponse({ status: 400, description: '사용자 정보가 유효하지 않습니다.' })
  async register(@Body() createUserDto: any) {
    return await firstValueFrom(this.authClient.send('register_user', createUserDto));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 로그인', description: '사용자 인증 후 JWT 토큰을 발급합니다.' })
  @ApiResponse({ status: 200, description: '로그인에 성공하고 토큰이 발급되었습니다.' })
  @ApiResponse({ status: 401, description: '로그인 정보가 유효하지 않습니다.' })
  async login(@Body() loginUserDto: any) {
    return await firstValueFrom(this.authClient.send('login_user', loginUserDto));
  }
}

// import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import { firstValueFrom } from 'rxjs';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { Public } from '../decorators/public.decorator';

// @ApiTags('인증')
// @Controller('auth')
// export class AuthController {
//   constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

//   /**
//    * 사용자 등록 엔드포인트
//    * @param createUserDto 새 사용자 정보
//    * @returns 등록된 사용자 정보
//    */
//   @Public()
//   @Post('register')
//   @ApiOperation({ summary: '사용자 등록', description: '새 사용자를 시스템에 등록합니다.' })
//   @ApiResponse({ status: 201, description: '사용자가 성공적으로 등록되었습니다.' })
//   @ApiResponse({ status: 400, description: '사용자 정보가 유효하지 않습니다.' })
//   async register(@Body() createUserDto: any) {
//     return await firstValueFrom(this.authClient.send('register_user', createUserDto));
//   }

//   /**
//    * 사용자 로그인 엔드포인트
//    * @param loginUserDto 로그인 정보
//    * @returns JWT 토큰 및 사용자 정보
//    */
//   @Public()
//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: '사용자 로그인', description: '사용자 인증 후 JWT 토큰을 발급합니다.' })
//   @ApiResponse({ status: 200, description: '로그인에 성공하고 토큰이 발급되었습니다.' })
//   @ApiResponse({ status: 401, description: '로그인 정보가 유효하지 않습니다.' })
//   async login(@Body() loginUserDto: any) {
//     return await firstValueFrom(this.authClient.send('login_user', loginUserDto));
//   }
// }

// import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import { firstValueFrom } from 'rxjs';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// @ApiTags('인증')
// @Controller('auth')
// export class AuthController {
//   constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

//   /**
//    * 사용자 등록 엔드포인트
//    * @param createUserDto 새 사용자 정보
//    * @returns 등록된 사용자 정보
//    */
//   @Post('register')
//   @ApiOperation({ summary: '사용자 등록', description: '새 사용자를 시스템에 등록합니다.' })
//   @ApiResponse({ status: 201, description: '사용자가 성공적으로 등록되었습니다.' })
//   @ApiResponse({ status: 400, description: '사용자 정보가 유효하지 않습니다.' })
//   async register(@Body() createUserDto: any) {
//     return await firstValueFrom(this.authClient.send('register_user', createUserDto));
//   }

//   /**
//    * 사용자 로그인 엔드포인트
//    * @param loginUserDto 로그인 정보
//    * @returns JWT 토큰 및 사용자 정보
//    */
//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: '사용자 로그인', description: '사용자 인증 후 JWT 토큰을 발급합니다.' })
//   @ApiResponse({ status: 200, description: '로그인에 성공하고 토큰이 발급되었습니다.' })
//   @ApiResponse({ status: 401, description: '로그인 정보가 유효하지 않습니다.' })
//   async login(@Body() loginUserDto: any) {
//     return await firstValueFrom(this.authClient.send('login_user', loginUserDto));
//   }
// }
