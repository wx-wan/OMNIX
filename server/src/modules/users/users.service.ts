import { Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit?: number) {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      select: USER_SELECT,
      where: { id },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : "";
    return this.prisma.user.create({
      select: USER_SELECT,
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role ?? "user",
        passwordHash,
      },
    });
  }
}
