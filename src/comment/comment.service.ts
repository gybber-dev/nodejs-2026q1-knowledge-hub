import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '../../generated/prisma/client';

type CommentResponse = Omit<Comment, 'createdAt'> & { createdAt: number };

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(comment: Comment): CommentResponse {
    return {
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt.getTime(),
    };
  }

  async findByArticleId(articleId: string): Promise<CommentResponse[]> {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
    });
    return comments.map((c) => this.toResponse(c));
  }

  async findById(id: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return this.toResponse(comment);
  }

  async create(dto: CreateCommentDto): Promise<CommentResponse> {
    const article = await this.prisma.article.findUnique({
      where: { id: dto.articleId },
    });
    if (!article) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} does not exist`,
      );
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });
    return this.toResponse(comment);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.comment.delete({ where: { id } });
  }
}
