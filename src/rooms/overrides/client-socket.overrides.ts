import { Socket } from 'socket.io';

export class ClientSocketOverride extends Socket {
  declare public data: {
    name?: string;
    roomSlug?: string;
    id?: string;
  };
}
