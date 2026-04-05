import { ArticleService } from './article.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('articles')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all articles' })
  @ApiResponse({ status: 200, description: 'List of all articles' })
  findAll() {
    return this.articleService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create new article' })
  @ApiResponse({ status: 201, description: 'Article created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto);
  }
}
