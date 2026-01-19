import { Matches, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(7, 51)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message:
      'username can only contain letters, numbers, dots, and underscores',
  })
  username!: string;

  @IsEmail()
  @Length(11, 99)
  email!: string;

  @IsNotEmpty()
  password!: string;
}
