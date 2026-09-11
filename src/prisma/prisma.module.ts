import { Module } from '@nestjs/common';
import { EmsPrismaService } from './ems-prisma.service';

@Module({
  providers: [EmsPrismaService],
  exports: [EmsPrismaService],
})
export class PrismaModule { }
