import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
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

  async register(email: string, name: string, password: string): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash },
    });
    return this.toPublic(user);
  }

  async validateUser(email: string, password: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.toPublic(user);
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toPublic(user) : null;
  }

  private toPublic(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }): PublicUser {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
