import {
  ArgumentsHost,
  Catch,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthCookiesService } from 'src/auth/auth-cookies/auth-cookies.service';

@Catch(UnauthorizedException)
export class UnauthorizedClearTokenException extends UnauthorizedException {
  constructor(private readonly authCookiesService: AuthCookiesService) {
    super();
  }

  private readonly logger = new Logger(UnauthorizedClearTokenException.name);

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(
      '[Caught Error] Attempted to access a non-existing user.',
      exception,
    );

    this.authCookiesService.clearCookieFromResponse(response, 'refreshToken', {
      maxAge: 0,
    });
    this.authCookiesService.clearCookieFromResponse(response, 'accessToken', {
      maxAge: 0,
    });

    return response.status(HttpStatus.UNAUTHORIZED).json({
      error: true,
      statusCode: HttpStatus.UNAUTHORIZED,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Unauthorized. Tokens have been cleared.',
    });
  }
}
