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
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInAuthDto } from './dto/sign-in-auth.dto';
import { Public } from 'src/_decorators/public.decorator';
import { RequestWithUserOverride } from 'src/_overrides/request-with-user.override';
import type { Request, Response } from 'express';
import { AuthCookiesService } from './auth-cookies/auth-cookies.service';
import { AuthRefreshTokensService } from './auth-refresh-tokens/auth-refresh-tokens.service';
import { AuthTokensService } from './auth-tokens/auth-tokens.service';
import { UnauthorizedClearTokenException } from './filters/exceptions/unauthorized-clear-token.exception';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
    private readonly authRefreshTokensService: AuthRefreshTokensService,
    private readonly authTokensService: AuthTokensService,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('user')
  getUser(@Req() request: RequestWithUserOverride) {
    return this.authService.getUserFromId(request?.user?.sub);
  }

  @Get()
  getStatus() {
    return { isAuthenticated: true };
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
      'accessToken',
      tokens.accessToken,
      {
        maxAge: 60 * 15 * 1000, // 15 minutes
      },
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

  @UseFilters(UnauthorizedClearTokenException)
  @Public()
  @Post('refresh')
  async refreshToken(@Req() request: Request, @Res() response: Response) {
    const { refreshToken } =
      this.authRefreshTokensService.extractTokenFromCookie(request);
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this.authTokensService.rotateTokens(
        refreshToken,
        request.ip,
        request.headers['user-agent'],
      );

    this.authCookiesService.setCookieToResponse(
      response,
      'accessToken',
      newAccessToken,
      {
        maxAge: 60 * 15 * 1000, // 15 minutes
      },
    );

    this.authCookiesService.setCookieToResponse(
      response,
      'refreshToken',
      newRefreshToken,
    );

    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
    });
  }

  @Post('sign-out')
  async signOut(@Res() response: Response) {
    await this.authService.signOut(response);
    this.authCookiesService.clearCookieFromResponse(response, 'refreshToken', {
      maxAge: 0,
    });
    this.authCookiesService.clearCookieFromResponse(response, 'accessToken', {
      maxAge: 0,
    });

    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Sign-out successful',
    });
  }
}
