import {
  Injectable,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

type StoredNonce = {
  hashed: string;
  exp: number;
  used: boolean;
};

@Injectable()
export class NonceService implements OnModuleDestroy {
  private readonly store = new Map<string, StoredNonce>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 만료된 nonce들을 주기적으로 정리 (1분마다)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredNonces();
    }, 60 * 1000);
  }

  onModuleDestroy() {
    // 애플리케이션 종료 시 interval 정리
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  validateNonceIfProvided(nonce?: string, nonceId?: string): void {
    // nonce와 nonceId가 모두 제공되었을 때만 검증
    if (nonce && nonceId) {
      // 여기서는 소비하지 않고 유효성만 확인
      this.check(nonceId, nonce);
    }
    // nonce 또는 nonceId 중 하나만 제공된 경우 에러
    else if (nonce || nonceId) {
      throw new BadRequestException(
        'Both nonce and nonceId must be provided together',
      );
    }
    // 둘 다 제공되지 않은 경우는 정상 (선택적 사용)
  }

  // 최종 성공 시점에만 사용 처리
  markUsed(nonceId: string): void {
    const saved = this.store.get(nonceId);
    if (!saved) {
      throw new BadRequestException('Invalid or expired nonceId');
    }
    if (saved.exp < Date.now()) {
      this.store.delete(nonceId);
      throw new BadRequestException('Nonce expired');
    }
    if (saved.used) {
      throw new BadRequestException('Nonce already used');
    }
    saved.used = true;
    this.store.set(nonceId, saved);
  }

  // nonce 유효성만 확인 (소비 안 함)
  check(nonceId: string, rawNonce: string): void {
    if (!nonceId || typeof nonceId !== 'string') {
      throw new BadRequestException('Invalid nonceId format');
    }
    if (!rawNonce || typeof rawNonce !== 'string') {
      throw new BadRequestException('Invalid nonce format');
    }

    const saved = this.store.get(nonceId);
    if (!saved) {
      throw new BadRequestException('Invalid or expired nonceId');
    }

    if (saved.exp < Date.now()) {
      this.store.delete(nonceId);
      throw new BadRequestException('Nonce expired');
    }

    if (saved.used) {
      throw new BadRequestException('Nonce already used');
    }

    const incomingHashed = this.hash(rawNonce);
    if (!this.constantTimeCompare(incomingHashed, saved.hashed)) {
      throw new BadRequestException('Invalid nonce');
    }
  }

  private hash(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  // timing attack 방지를 위한 constant-time 문자열 비교
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  // 만료된 nonce들을 정리하는 메서드
  private cleanupExpiredNonces(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [nonceId, stored] of this.store.entries()) {
      if (stored.exp < now) {
        expiredKeys.push(nonceId);
      }
    }

    expiredKeys.forEach((key) => this.store.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired nonces`);
    }
  }

  issue(): {
    nonceId: string; // Apple SDK에 전달 (Apple 서버 검증용)
    rawNonce: string; // 서버에 전달 (서버 검증용)
    hashedNonce: string; // 서버에 전달 (서버 검증용)
  } {
    const raw = randomBytes(32).toString('hex');
    const hashed = this.hash(raw);
    const nonceId = randomBytes(16).toString('hex');
    const exp = Date.now() + this.ttlMs;

    this.store.set(nonceId, { hashed, exp, used: false });
    return {
      nonceId,
      rawNonce: raw,
      hashedNonce: hashed,
    };
  }
}
