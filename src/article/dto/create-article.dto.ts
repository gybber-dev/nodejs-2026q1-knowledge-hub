import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { ArticleStatus } from 'src/common/enums/article-status.enum';

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

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
