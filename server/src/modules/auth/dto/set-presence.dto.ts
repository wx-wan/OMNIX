import { IsIn } from "class-validator";
import type { PresenceStatus } from "../presence.service";

export class SetPresenceDto {
  @IsIn(["online", "away", "busy", "offline"])
  status: PresenceStatus;
}
