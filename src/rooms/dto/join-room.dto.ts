import { IsString } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;
}
