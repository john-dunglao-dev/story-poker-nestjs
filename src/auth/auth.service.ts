import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { verify } from 'argon2';
import { AuthAccessTokensService } from './auth-access-tokens/auth-access-tokens.service';
import { AuthRefreshTokensService } from './auth-refresh-tokens/auth-refresh-tokens.service';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authAccessTokensService: AuthAccessTokensService,
    private readonly authRefreshTokensService: AuthRefreshTokensService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!email || !password) {
      this.logger.error('Username or password not provided');
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = await this.usersService.findOneWithHiddenFields({ email });

    if (!user) {
      this.logger.error(`User not found: ${email}`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isAuthenticated = await verify(user.password, password);

    if (!isAuthenticated) {
      this.logger.error(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.authAccessTokensService.generateToken(
      user.id,
    );
    const refreshToken = await this.authRefreshTokensService.generateToken(
      user.id,
    );

    this.logger.log(`User signed in: ${email}`);

    await this.authRefreshTokensService.createRefreshToken(
      user.id,
      refreshToken,
      new Date(
        Date.now() +
          this.configService.get<number>(
            'AUTH_REFRESH_TOKEN_EXPIRATION_MS',
            604800000,
          ),
      ),
      ipAddress,
      userAgent,
    );

    return { accessToken, refreshToken };
  }

  async getUserFromId(id?: number): Promise<User | null> {
    if (!id) {
      throw new UnauthorizedException('Invalid token.');
    }

    return this.usersService.findOne({ id });
  }
}
