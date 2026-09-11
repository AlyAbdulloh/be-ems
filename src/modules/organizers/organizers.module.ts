import { Module } from '@nestjs/common';
import { OrganizersController } from './organizers.controller';
import { OrganizersService } from './organizers.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizersController],
  providers: [OrganizersService],
  exports: [OrganizersService],
})
export class OrganizersModule {}
