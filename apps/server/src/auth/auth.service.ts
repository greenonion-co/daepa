import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ProviderInfo } from './auth.types';
import { UserDto } from 'src/user/user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(providerInfo: ProviderInfo) {
    const { provider, providerId } = providerInfo;

    const userFound = await this.userService.findOne({
      provider,
      provider_id: providerId,
    });

    if (!userFound) {
      const userCreated = await this.userService.createUser(providerInfo);
      return userCreated;
    }

    return userFound;
  }

  async getJwtToken(user: UserDto) {
    const payload = { username: user.name, sub: user.userId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '1y',
      secret: process.env.JWT_REFRESH_SECRET ?? '',
    });

    await this.updateUserRefreshToken(user.userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async updateUserRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const user = await this.userService.findOne({ user_id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // TODO: refresh token 해싱 하여 저장 필요
    // const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // TODO: expire date의 end of day 계산하여 저장
    // TODO: duration을 환경변수화
    // Calculate expiration date
    const expiresIn = '1y'; // e.g., '7d'
    const expiresAt = new Date();
    // A simple way to parse expiration (you might need a more robust parser for '15m', '7d', etc.)
    // For simplicity, let's assume '7d' means adding 7 days.
    const duration = parseInt(expiresIn.slice(0, -1));
    const unit = expiresIn.slice(-1);

    if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + duration);
    else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + duration);
    else if (unit === 'm')
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    else if (unit === 'y')
      expiresAt.setFullYear(expiresAt.getFullYear() + duration);

    await this.userService.update(user.userId, {
      refreshToken: refreshToken,
      refreshTokenExpiresAt: expiresAt,
    });
  }
}
