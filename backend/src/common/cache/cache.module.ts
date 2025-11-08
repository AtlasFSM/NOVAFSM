import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get('REDIS_HOST') || 'localhost',
          port: Number(configService.get('REDIS_PORT') || 6379),
          password: configService.get('REDIS_PASSWORD'),
          ttl: 300_000, // 5 minutes in milliseconds
        }),
        max: 1000,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
