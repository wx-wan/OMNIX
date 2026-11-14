import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import { ContactType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<PublicUser> {
    const existing = await this.prisma.contact.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.contact.create({
      data: {
        email,
        name,
        type: ContactType.user,
        role: "user",
        password: passwordHash,
      },
    });
    return this.toPublic(user);
  }

  async validateUser(email: string, password: string): Promise<PublicUser> {
    const user = await this.prisma.contact.findUnique({ where: { email } });
    if (!user || user.type !== ContactType.user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.toPublic(user);
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.contact.findUnique({ where: { id } });
    return user ? this.toPublic(user) : null;
  }

  async updateProfile(id: string, name: string): Promise<PublicUser> {
    const user = await this.prisma.contact.update({
      where: { id },
      data: { name },
    });
    return this.toPublic(user);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.contact.findUnique({ where: { id } });
    if (!user || user.type !== ContactType.user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    await this.prisma.contact.update({
      where: { id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });
  }

  private toPublic(user: {
    id: string;
    email: string | null;
    name: string;
    role: string | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email ?? "",
      name: user.name,
      role: user.role ?? "user",
    };
  }
}
