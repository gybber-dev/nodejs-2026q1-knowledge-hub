import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article, ArticleStatus } from '../../generated/prisma/client';

export interface ArticleFilter {
  status?: ArticleStatus;
  categoryId?: string;
  tag?: string;
}

type ArticleWithTags = Article & { tags: { name: string }[] };

type ArticleResponse = Omit<Article, 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number;
  tags: string[];
};

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(article: ArticleWithTags): ArticleResponse {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      authorId: article.authorId,
      categoryId: article.categoryId,
      createdAt: article.createdAt.getTime(),
      updatedAt: article.updatedAt.getTime(),
      tags: article.tags.map((t) => t.name),
    };
  }

  private buildTagsConnectOrCreate(tags: string[]) {
    return tags.map((name) => ({
      where: { name },
      create: { name },
    }));
  }

  async findAll(filter?: ArticleFilter): Promise<ArticleResponse[]> {
    const articles = await this.prisma.article.findMany({
      where: {
        ...(filter?.status && { status: filter.status }),
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
        ...(filter?.tag && { tags: { some: { name: filter.tag } } }),
      },
      include: { tags: true },
    });
    return articles.map((a) => this.toResponse(a));
  }

  async findById(id: string): Promise<ArticleResponse> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return this.toResponse(article);
  }

  async create(dto: CreateArticleDto): Promise<ArticleResponse> {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: (dto.status as ArticleStatus) ?? 'draft',
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: {
          connectOrCreate: this.buildTagsConnectOrCreate(dto.tags ?? []),
        },
      },
      include: { tags: true },
    });
    return this.toResponse(article);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<ArticleResponse> {
    await this.findById(id);

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.status !== undefined && {
          status: dto.status as ArticleStatus,
        }),
        ...(dto.authorId !== undefined && { authorId: dto.authorId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags !== undefined && {
          tags: {
            set: [],
            connectOrCreate: this.buildTagsConnectOrCreate(dto.tags),
          },
        }),
      },
      include: { tags: true },
    });
    return this.toResponse(article);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.article.delete({ where: { id } });
  }
}
