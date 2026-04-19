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
  ApiBearerAuth,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('articles')
@ApiBearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all articles with optional filtering, sorting and pagination' })
  @ApiQuery({ name: 'status', enum: ArticleStatus, required: false })
  @ApiQuery({ name: 'categoryId', type: 'string', required: false })
  @ApiQuery({ name: 'tag', type: 'string', required: false })
  @ApiQuery({ name: 'sortBy', required: false, type: 'string', example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, type: ArticleResponseEntity, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiResponse({ status: 200, type: ArticleResponseEntity })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create new article (admin, editor)' })
  @ApiResponse({ status: 201, type: ArticleResponseEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.articleService.create(dto, currentUser);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update article (admin or editor — own article only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ArticleResponseEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or not owner' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.articleService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Delete article (admin or editor — own article only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Article deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or not owner' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.articleService.delete(id, currentUser);
  }
}
