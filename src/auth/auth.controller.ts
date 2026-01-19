import { Controller, Post, Body, Get, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInAuthDto } from './dto/sign-in-auth.dto';
import { Public } from 'src/_decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register() {}

  @Get()
  getStatus() {
    return { code: HttpStatus.OK, message: 'Auth service is running.' };
  }

  @Public()
  @Post()
  signIn(@Body() signInAuthDto: SignInAuthDto) {
    const { username, password } = signInAuthDto;
    return this.authService.signIn(username, password);
  }

  @Post('refresh')
  refreshToken() {}

  @Post('sign-out')
  signOut() {}
}
