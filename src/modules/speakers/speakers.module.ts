import { Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports: [SpeakersService],
  imports: [PrismaModule]
})
export class SpeakersModule { }
