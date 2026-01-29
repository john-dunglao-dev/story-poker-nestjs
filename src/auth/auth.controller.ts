import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInAuthDto } from './dto/sign-in-auth.dto';
import { Public } from 'src/_decorators/public.decorator';
import { RefreshAuthTokenDto } from './dto/refresh-auth-token.dto';
import { RequestWithUserOverride } from 'src/_overrides/request-with-user.override';

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
  signIn(@Body() signInAuthDto: SignInAuthDto) {
    const { email, password } = signInAuthDto;
    return this.authService.signIn(email, password);
  }

  @Public()
  @Post('refresh')
  refreshToken(@Body() refreshAuthTokenDto: RefreshAuthTokenDto) {
    const { accessToken, refreshToken } = refreshAuthTokenDto;
    return this.authService.refreshToken(accessToken, refreshToken);
  }
}
