import { IsOptional, IsString } from 'class-validator';

export class RefreshAuthTokenDto {
  @IsString()
  @IsOptional()
  accessToken: string;

  @IsString()
  @IsOptional()
  refreshToken: string;
}
