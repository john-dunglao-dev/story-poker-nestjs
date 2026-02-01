import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInAuthDto } from './dto/sign-in-auth.dto';
import { Public } from 'src/_decorators/public.decorator';
import { RequestWithUserOverride } from 'src/_overrides/request-with-user.override';
import type { Request, Response } from 'express';
import { AuthCookiesService } from './auth-cookies/auth-cookies.service';
import { AuthRefreshTokensService } from './auth-refresh-tokens/auth-refresh-tokens.service';
import { AuthAccessTokensService } from './auth-access-tokens/auth-access-tokens.service';
import { AuthTokensService } from './auth-tokens/auth-tokens.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
    private readonly authRefreshTokensService: AuthRefreshTokensService,
    private readonly authAccessTokensService: AuthAccessTokensService,
    private readonly authTokensService: AuthTokensService,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('user')
  getUser(@Req() request: RequestWithUserOverride) {
    return this.authService.getUserFromId(request?.user?.sub);
  }

  @Get()
  getStatus() {
    return { code: HttpStatus.OK, message: 'Auth service is running.' };
  }

  @Public()
  @Post()
  async signIn(
    @Req() request: Request,
    @Body() signInAuthDto: SignInAuthDto,
    @Res() response: Response,
  ) {
    const { email, password } = signInAuthDto;
    const tokens = await this.authService.signIn(
      email,
      password,
      request.ip,
      request.headers['user-agent'],
    );
    this.authCookiesService.setCookieToResponse(
      response,
      'refreshToken',
      tokens.refreshToken,
    );

    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Sign-in successful',
      accessToken: tokens.accessToken,
    });
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Req() request: Request, @Res() response: Response) {
    const { accessToken } =
      this.authAccessTokensService.extractTokenFromHeader(request);
    const { refreshToken } =
      this.authRefreshTokensService.extractTokenFromCookie(request);

    const { accessToken: newAccessToken } =
      await this.authTokensService.rotateAccessToken(accessToken, refreshToken);

    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  }
}
