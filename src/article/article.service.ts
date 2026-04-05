import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '../common/enums/article-status.enum';
import { CommentService } from '../comment/comment.service';

export interface ArticleFilter {
  status?: ArticleStatus;
  categoryId?: string;
  tag?: string;
}

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findAll(filter?: ArticleFilter): Article[] {
    let result = this.articles;

    if (filter?.status) {
      result = result.filter((a) => a.status === filter.status);
    }
    if (filter?.categoryId) {
      result = result.filter((a) => a.categoryId === filter.categoryId);
    }
    if (filter?.tag) {
      result = result.filter((a) => a.tags.includes(filter.tag));
    }

    return result;
  }

  findById(id: string): Article {
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return article;
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();
    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.articles.push(article);
    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    const article = this.findById(id);
    Object.assign(article, {
      ...dto,
      updatedAt: Date.now(),
    });
    return article;
  }

  delete(id: string): void {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    this.commentService.deleteByArticleId(id);
    this.articles.splice(index, 1);
  }

  nullifyAuthor(userId: string): void {
    this.articles
      .filter((a) => a.authorId === userId)
      .forEach((a) => {
        a.authorId = null;
      });
  }

  nullifyCategory(categoryId: string): void {
    this.articles
      .filter((a) => a.categoryId === categoryId)
      .forEach((a) => {
        a.categoryId = null;
      });
  }
}
