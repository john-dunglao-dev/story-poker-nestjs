import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { verify } from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DecodedJwt } from './interfaces/decoded-jwt.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(username: string, password: string) {
    if (!username || !password) {
      this.logger.error('Username or password not provided');
      throw new UnauthorizedException('Invalid username or password.');
    }

    const user = await this.usersService.findOneWithHiddenFields({ username });

    if (!user) {
      this.logger.error(`User not found: ${username}`);
      throw new UnauthorizedException('Invalid username or password.');
    }

    const isAuthenticated = await verify(user.password, password);

    if (isAuthenticated) {
      const accessToken = await this.generateAccessToken(
        user.id,
        user.username,
      );
      const refreshToken = await this.generateRefreshToken(user.id);

      return { accessToken, refreshToken };
    }

    this.logger.error(`Invalid password for user: ${username}`);
    throw new UnauthorizedException('Invalid username or password.');
  }

  async refreshToken(accessToken: string, refreshToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('Access token not provided.');
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided.');
    }

    // decode access token payload (may be expired)
    const decoded: DecodedJwt = this.jwtService.decode(accessToken);

    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid access token.');
    }

    let refreshPayload: DecodedJwt;
    try {
      refreshPayload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      this.logger.error('Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (refreshPayload.sub.toString() !== decoded.sub.toString()) {
      this.logger.error(
        'Refresh token subject does not match access token subject',
      );
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersService.findOne({ id: Number(decoded.sub) });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // issue new access token (and optionally rotate refresh token)
    const newAccessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: decoded.username || user.username,
    });

    return { accessToken: newAccessToken };
  }

  async getUserFromUsername(username?: string) {
    if (!username) {
      throw new UnauthorizedException('Invalid token.');
    }

    return await this.usersService.findOne({ username });
  }

  private async generateRefreshToken(sub: number) {
    const expirationMs =
      this.configService.get<number>('JWT_REFRESH_EXPIRES_IN') || 604800;

    return await this.jwtService.signAsync(
      { sub },
      { expiresIn: expirationMs },
    );
  }

  private async generateAccessToken(sub: number, username: string) {
    return await this.jwtService.signAsync({
      sub,
      username,
    });
  }
}
