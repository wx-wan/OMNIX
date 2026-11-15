import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "name too short" })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  avatarUrl?: string;
}
