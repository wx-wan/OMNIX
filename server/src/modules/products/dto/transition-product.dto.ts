import { IsIn, IsString } from "class-validator";

export class TransitionProductDto {
  @IsString()
  @IsIn(["requirement", "designing", "reviewing", "released", "obsolete"])
  status: string;
}
