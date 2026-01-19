import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEmailDto } from './dto/user-created-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  @OnEvent('user.created.next.email')
  handleUserCreatedEvent(payload: UserCreatedEmailDto) {
    this.logger.log(`User created event received: ${JSON.stringify(payload)}`);
    // Logic to send email when a user is created
  }
}
