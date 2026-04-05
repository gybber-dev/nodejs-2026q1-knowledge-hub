import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../../common/enums/article-status.enum';

export class ArticleResponseEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Introduction to NestJS' })
  title: string;

  @ApiProperty({ example: 'NestJS is a framework...' })
  content: string;

  @ApiProperty({ enum: ArticleStatus, example: ArticleStatus.DRAFT })
  status: ArticleStatus;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  authorId: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryId: string | null;

  @ApiProperty({ example: ['nestjs', 'typescript'], isArray: true })
  tags: string[];

  @ApiProperty({ example: 1655000000 })
  createdAt: number;

  @ApiProperty({ example: 1655000000 })
  updatedAt: number;
}
