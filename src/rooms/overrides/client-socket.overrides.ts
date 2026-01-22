import { Socket } from 'socket.io';
import { Room } from '../entities/room.entity';

export class ClientSocketOverride extends Socket {
  declare public data: {
    name?: string;
    roomSlug?: string;
    id?: string;
    room?: Room;
  };
}
