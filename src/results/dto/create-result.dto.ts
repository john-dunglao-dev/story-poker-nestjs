import { IsNumber, IsString } from 'class-validator';

export class CreateResultDto {
  @IsNumber()
  roomId: number;

  @IsString()
  topic: string = 'New Topic';
}
