import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '../common/enums/article-status.enum';
import { ArticleResponseEntity } from './entities/article-response.entity';

@ApiTags('articles')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all articles with optional filtering, sorting and pagination',
  })
  @ApiQuery({ name: 'status', enum: ArticleStatus, required: false })
  @ApiQuery({ name: 'categoryId', type: 'string', required: false })
  @ApiQuery({ name: 'tag', type: 'string', required: false })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    example: 'createdAt',
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of articles',
    type: ArticleResponseEntity,
    isArray: true,
  })
  async findAll(
    @Query('status') status?: ArticleStatus,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.articleService.findAll(
      { status, categoryId, tag },
      { sortBy, order, page, limit },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Article found',
    type: ArticleResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new article' })
  @ApiResponse({
    status: 201,
    description: 'Article created',
    type: ArticleResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update article' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Article updated',
    type: ArticleResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete article' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Article deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleService.delete(id);
  }
}
