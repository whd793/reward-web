import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User, UserSchema } from './schemas/user.schema';
import { CommonModule } from '@app/common';
import configuration, { validationSchema } from './config/configuration';

@Module({
  imports: [
    // 구성 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // MongoDB 연결
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),

    // Mongoose 스키마 등록
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // JWT 모듈
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
    }),

    // 공통 모듈
    CommonModule,
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService, JwtStrategy, LocalStrategy],
})
export class AppModule {}
