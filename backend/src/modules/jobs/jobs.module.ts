import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { TechnicianScheduleService } from './schedule.service';
import { JobsGateway } from './jobs-gateway';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SequenceService } from '../../common/services/sequence.service';

/**
 * Jobs Module
 * Manages jobs/work orders with WebSocket support
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.get<string>('jwt.privateKey'),
        publicKey: configService.get<string>('jwt.publicKey'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: configService.get<string>('jwt.accessExpiry'),
          issuer: configService.get<string>('jwt.issuer'),
          audience: configService.get<string>('jwt.audience'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, TechnicianScheduleService, JobsGateway, SequenceService],
  exports: [JobsService, TechnicianScheduleService, JobsGateway],
})
export class JobsModule {}
