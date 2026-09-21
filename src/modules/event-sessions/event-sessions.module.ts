import { Module } from '@nestjs/common';
import { EventSessionsService } from './event-sessions.service';
import { EventSessionsController } from './event-sessions.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventSessionsController],
  providers: [EventSessionsService],
  exports: [EventSessionsService],
})
export class EventSessionsModule {}
