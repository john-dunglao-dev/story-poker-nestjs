import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { verify } from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string) {
    if (!username || !password) {
      this.logger.error('Username or password not provided');
      throw new UnauthorizedException('Invalid username or password.');
    }

    const user = await this.usersService.findOne({ username });

    if (!user) {
      this.logger.error(`User not found: ${username}`);
      throw new UnauthorizedException('Invalid username or password.');
    }

    const isAuthenticated = await verify(user.password, password);

    if (isAuthenticated) {
      return {
        accessToken: await this.jwtService.signAsync({
          sub: user.id,
          username: user.username,
        }),
      };
    }

    this.logger.error(`Invalid password for user: ${username}`);
    throw new UnauthorizedException('Invalid username or password.');
  }
}
