import { IsEmail, IsString, IsOptional, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  role?: string;
}
