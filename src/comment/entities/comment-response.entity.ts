import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Great article!' })
  content: string;

  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  authorId: string | null;

  @ApiProperty({ example: 1655000000 })
  createdAt: number;
}
