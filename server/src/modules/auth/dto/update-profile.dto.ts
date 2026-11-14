import { IsString, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @MinLength(2, { message: "name too short" })
  name: string;
}
