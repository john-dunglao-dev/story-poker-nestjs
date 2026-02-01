import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { WsHostAuthGuard } from './guards/ws-host-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRefreshToken } from './auth-refresh-tokens/entities/auth-refresh-token.entity';
import { AuthRefreshTokensService } from './auth-refresh-tokens/auth-refresh-tokens.service';
import { AuthAccessTokensService } from './auth-access-tokens/auth-access-tokens.service';
import { AuthCookiesService } from './auth-cookies/auth-cookies.service';
import { AuthTokensService } from './auth-tokens/auth-tokens.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthRefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('JWT_EXPIRES_IN', 3600),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    WsHostAuthGuard,
    // enables global auth guard
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AuthRefreshTokensService,
    AuthAccessTokensService,
    AuthCookiesService,
    AuthTokensService,
  ],
  exports: [WsHostAuthGuard, AuthAccessTokensService],
})
export class AuthModule {}
