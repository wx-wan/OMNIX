import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PresenceController } from "./presence.controller";
import { PresenceService } from "./presence.service";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, PresenceController],
  providers: [AuthService, PresenceService],
  exports: [AuthService, PresenceService],
})
export class AuthModule {}
