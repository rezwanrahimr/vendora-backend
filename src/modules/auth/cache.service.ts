import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Store password reset verification code
  async setResetCode(email: string, code: string, ttl: number = 900): Promise<void> {
    const key = `reset_code:${email}`;
    await this.cacheManager.set(key, code, ttl * 1000); // 15 minutes default
  }

  // Get password reset verification code
  async getResetCode(email: string): Promise<string | undefined> {
    const key = `reset_code:${email}`;
    return await this.cacheManager.get(key);
  }

  // Delete password reset verification code
  async deleteResetCode(email: string): Promise<void> {
    const key = `reset_code:${email}`;
    await this.cacheManager.del(key);
  }

  // Store password reset token
  async setResetToken(token: string, email: string, ttl: number = 600): Promise<void> {
    const key = `reset_token:${token}`;
    await this.cacheManager.set(key, email, ttl * 1000); // 10 minutes default
  }

  // Get email from password reset token
  async getEmailFromToken(token: string): Promise<string | undefined> {
    const key = `reset_token:${token}`;
    return await this.cacheManager.get(key);
  }

  // Delete password reset token
  async deleteResetToken(token: string): Promise<void> {
    const key = `reset_token:${token}`;
    await this.cacheManager.del(key);
  }
}
