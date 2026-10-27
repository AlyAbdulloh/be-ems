import { Module } from "@nestjs/common";
import { EventRegistrationService } from "./event-registration.service";
import { EventRegistrationController } from "./event-registration.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [EventRegistrationController],
  providers: [EventRegistrationService],
  exports: [EventRegistrationService],
})
export class EventRegistrationModule {}
