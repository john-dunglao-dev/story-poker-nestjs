import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 100)
  slug: string;

  @IsString()
  @Length(1, 100)
  @IsOptional()
  value: string | null;

  @IsNumber()
  resultId: number;
}
