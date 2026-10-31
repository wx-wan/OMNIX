import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2, { message: "name too short" })
  name: string;

  @IsString()
  @MinLength(6, { message: "password too short" })
  password: string;
}
