import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ArticleStatus } from '../../common/enums/article-status.enum';

export class CreateArticleDto {
  @ApiProperty({ example: 'Introduction to NestJS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'NestJS is a framework for building efficient server-side applications',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: ArticleStatus, default: ArticleStatus.DRAFT })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @IsString()
  authorId?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: ['nestjs', 'typescript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
