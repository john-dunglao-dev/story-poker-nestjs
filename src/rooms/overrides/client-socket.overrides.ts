import { Socket } from 'socket.io';
import { Room } from '../entities/room.entity';

export interface ClientSocketData {
  name?: string;
  nameSlug?: string;
  roomSlug?: string;
  id?: string;
  room?: Room;
  host?: {
    email: string;
  };
}

export class ClientSocketOverride extends Socket {
  declare public data: ClientSocketData;
}
