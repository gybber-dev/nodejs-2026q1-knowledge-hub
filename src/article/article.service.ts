import { Injectable, NotFoundException } from '@nestjs/common';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatus } from 'src/common/enums/article-status.enum';
import { randomUUID } from 'crypto';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  findAll(): Article[] {
    return this.articles;
  }

  findById(id: string): Article {
    const article = this.articles.find((c) => c.id === id);
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
    return article;
  }

  create(dto: CreateArticleDto): Article {
    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId,
      categoryId: dto.categoryId,
      tags: dto.tags ?? [],
    };
    this.articles.push(article);
    return article;
  }
}
