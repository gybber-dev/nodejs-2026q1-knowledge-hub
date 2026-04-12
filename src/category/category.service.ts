import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '../../generated/prisma/client';
import {
  ListQuery,
  PaginatedResult,
  parsePrismaListArgs,
} from '../common/utils/list.utils';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query?: ListQuery,
  ): Promise<Category[] | PaginatedResult<Category>> {
    const { orderBy, skip, take, pagination } = parsePrismaListArgs(
      query ?? {},
    );

    if (pagination) {
      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({ orderBy, skip, take }),
        this.prisma.category.count(),
      ]);
      return {
        data: categories,
        total,
        page: pagination.page,
        limit: pagination.limit,
      };
    }

    return this.prisma.category.findMany({ orderBy });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: { ...dto },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.category.delete({ where: { id } });
  }
}
