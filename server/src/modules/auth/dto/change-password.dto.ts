import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: "password too short" })
  newPassword: string;
}
