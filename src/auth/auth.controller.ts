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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('user')
  getUser(@Req() request: RequestWithUserOverride) {
    return this.authService.getUserFromEmail(request?.user?.email);
  }

  @Get()
  getStatus() {
    return { code: HttpStatus.OK, message: 'Auth service is running.' };
  }

  @Public()
  @Post()
  async signIn(
    @Body() signInAuthDto: SignInAuthDto,
    @Res() response: Response,
  ) {
    const { email, password } = signInAuthDto;
    const tokens = await this.authService.signIn(email, password);
    this.authService.setAccessTokenCookie(response, tokens.accessToken);
    this.authService.setRefreshTokenCookie(response, tokens.refreshToken);

    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Sign-in successful',
    });
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Req() request: Request, @Res() response: Response) {
    const { accessToken, refreshToken } =
      this.authService.extractTokenFromCookie(request);

    const { accessToken: newAccessToken } = await this.authService.refreshToken(
      accessToken,
      refreshToken,
    );

    this.authService.setAccessTokenCookie(response, newAccessToken);

    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  }
}
