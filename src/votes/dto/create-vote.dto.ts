import { IsNumber, IsString, Length } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 100)
  value: string;

  @IsNumber()
  resultId: number;
}
