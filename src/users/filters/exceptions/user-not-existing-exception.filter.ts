import {
  ArgumentsHost,
  Catch,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(NotFoundException)
export class UserNotExistingExceptionFilter extends NotFoundException {
  private readonly logger = new Logger(UserNotExistingExceptionFilter.name);

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(
      '[Caught Error] Attempted to access a non-existing user.',
      exception,
    );

    return response.status(HttpStatus.NOT_FOUND).json({
      error: true,
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'User not found.',
    });
  }
}
