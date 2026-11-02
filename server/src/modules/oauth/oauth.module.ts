import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OauthController } from "./oauth.controller";
import { OauthService } from "./oauth.service";

@Module({
  imports: [AuthModule],
  controllers: [OauthController],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
