import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    console.warn(`[JwtStrategy] Initializing with secret length: ${secret?.length || 0}`);
    if (!secret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.warn(`[JwtStrategy] Validating payload for sub: ${payload.sub}`);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      console.warn(`[JwtStrategy] User not found for sub: ${payload.sub}`);
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return { userId: user.id, email: user.email };
  }
}
