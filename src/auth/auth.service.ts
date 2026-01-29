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

  async signIn(email: string, password: string) {
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

    if (isAuthenticated) {
      const accessToken = await this.generateAccessToken(user.id, user.email);
      const refreshToken = await this.generateRefreshToken(user.id);

      return { accessToken, refreshToken };
    }

    this.logger.error(`Invalid password for user: ${email}`);
    throw new UnauthorizedException('Invalid email or password.');
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

    const user = await this.usersService.findOne({ id: decoded.sub });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // issue new access token (and optionally rotate refresh token)
    const newAccessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: decoded.email || user.email,
    });

    return { accessToken: newAccessToken };
  }

  async getUserFromEmail(email?: string) {
    if (!email) {
      throw new UnauthorizedException('Invalid token.');
    }

    return await this.usersService.findOne({ email });
  }

  private async generateRefreshToken(sub: number) {
    const expirationMs =
      this.configService.get<number>('JWT_REFRESH_EXPIRES_IN') || 604800;

    return await this.jwtService.signAsync(
      { sub },
      { expiresIn: expirationMs },
    );
  }

  private async generateAccessToken(sub: number, email: string) {
    return await this.jwtService.signAsync({
      sub,
      email,
    });
  }

  async validateToken(token: string): Promise<DecodedJwt> {
    return await this.jwtService.verifyAsync<DecodedJwt>(token);
  }
}
