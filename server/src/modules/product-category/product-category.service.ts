import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  specTemplate: unknown;
  children: CategoryNode[];
}

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** 返回多级分类树（嵌套 children）。 */
  async listTree(): Promise<CategoryNode[]> {
    const all = await this.prisma.productCategory.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    const byId = new Map<string, CategoryNode>();
    all.forEach((c) =>
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        position: c.position,
        specTemplate: c.specTemplate,
        children: [],
      }),
    );
    const roots: CategoryNode[] = [];
    byId.forEach((node) => {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  create(dto: {
    name: string;
    parentId?: string | null;
    position?: number;
    specTemplate?: unknown; }) {
    return this.prisma.productCategory.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        position: dto.position ?? 0,
        specTemplate: (dto.specTemplate as never) ?? undefined,
      },
    });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      parentId?: string | null;
      position?: number;
      specTemplate?: unknown;
    },
  ) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException(`Category ${id} not found`);
    if (dto.parentId === id) {
      throw new BadRequestException("不能将分类设为自身的父级");
    }
    return this.prisma.productCategory.update({
      where: { id },
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        position: dto.position,
        specTemplate: (dto.specTemplate as never) ?? undefined,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException(`Category ${id} not found`);
    // 子节点由 onDelete: Cascade 级联删除；产品 categoryId 置空
    await this.prisma.productCategory.delete({ where: { id } });
    return { ok: true };
  }
}
