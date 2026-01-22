import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class AttendanceWsException extends WsException {
  catch(exception: WsException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    client.emit('error', {
      error: true,
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
    });
  }
}
