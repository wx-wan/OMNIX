import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  /** 记住此设备：勾选时后端下发持久化 cookie（30 天），否则为会话 cookie。 */
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
