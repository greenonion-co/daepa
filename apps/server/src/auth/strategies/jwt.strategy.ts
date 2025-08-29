import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { USER_ROLE } from 'src/user/user.constant';

export type JwtPayload = {
  sub: string;
  iat?: number;
  exp?: number;
  role: USER_ROLE;
  status: 'authenticated' | 'anonymous'; // TODO: 비로그인 사용자 세션 관리 시 사용
};

export type JwtUserPayload = {
  userId: string;
  role: USER_ROLE;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, //if supplied with an expired JWT, the request will be denied and a 401 Unauthorized response sent
      secretOrKey: process.env.JWT_SECRET ?? '',
    });
  }

  validate(payload: JwtPayload): JwtUserPayload {
    return { userId: payload.sub, role: payload.role };
  }
}
