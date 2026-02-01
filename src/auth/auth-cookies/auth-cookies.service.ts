import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class AuthCookiesService {
  private readonly logger = new Logger(AuthCookiesService.name);

  constructor(private readonly configService: ConfigService) {}

  setCookieToResponse(
    response: Response,
    name: string,
    value: string,
    options: Record<string, any> = {},
  ): void {
    response.cookie(name, value, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge:
        this.configService.get<number>(
          'REFRESH_TOKEN_EXPIRATION',
          60 * 5, // default to 5 minutes
        ) * 1000,
      ...options,
    });
    this.logger.debug(`Set cookie: ${name}`);
  }

  clearCookieFromResponse(
    response: Response,
    name: string,
    options: Record<string, any> = {},
  ): void {
    response.clearCookie(name, options);
    this.logger.debug(`Cleared cookie: ${name}`);
  }
}
