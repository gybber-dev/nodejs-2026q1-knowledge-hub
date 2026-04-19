import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from '../../generated/prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/enums/user-role.enum';
import {
  ListQuery,
  PaginatedResult,
  parsePrismaListArgs,
} from '../common/utils/list.utils';

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

  async findByArticleId(
    articleId: string,
    query?: ListQuery,
  ): Promise<CommentResponse[] | PaginatedResult<CommentResponse>> {
    const { orderBy, skip, take, pagination } = parsePrismaListArgs(
      query ?? {},
    );
    const where = { articleId };

    if (pagination) {
      const [comments, total] = await Promise.all([
        this.prisma.comment.findMany({ where, orderBy, skip, take }),
        this.prisma.comment.count({ where }),
      ]);
      return {
        data: comments.map((c) => this.toResponse(c)),
        total,
        page: pagination.page,
        limit: pagination.limit,
      };
    }

    const comments = await this.prisma.comment.findMany({
      where,
      orderBy,
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

  async update(
    id: string,
    dto: UpdateCommentDto,
    currentUser: JwtPayload,
  ): Promise<CommentResponse> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      existing.authorId !== currentUser.userId
    ) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
      },
    });
    return this.toResponse(updated);
  }

  async delete(id: string, currentUser: JwtPayload): Promise<void> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      existing.authorId !== currentUser.userId
    ) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id } });
  }
}
