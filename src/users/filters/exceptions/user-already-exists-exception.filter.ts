import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { MysqlDriverError } from 'src/_database/interfaces/mysql-driver-error.interface';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class UserAlreadyExistsExceptionFilter {
  private readonly logger = new Logger(UserAlreadyExistsExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const driverError = exception.driverError as unknown as MysqlDriverError;

    if (driverError.code === 'ER_DUP_ENTRY') {
      this.logger.error(`[Caught Error] Database error: ${exception.message}`);

      return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Email or username unavailable.',
      });
    }

    this.logger.error(
      `[Uncaught Error] Unexpected error: ${exception.message}`,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: true,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Internal server error',
    });
  }
}
