import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(7, 255)
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(11, 99)
  email!: string;

  @IsNotEmpty()
  password!: string;
}
