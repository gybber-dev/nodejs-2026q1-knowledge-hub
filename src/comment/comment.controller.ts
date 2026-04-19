import {
  BadRequestException,
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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseEntity } from './entities/comment-response.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all comments for an article' })
  @ApiQuery({ name: 'articleId', type: 'string', required: true })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    example: 'createdAt',
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, type: CommentResponseEntity, isArray: true })
  @ApiResponse({ status: 400, description: 'articleId is missing or invalid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByArticle(
    @Query('articleId') articleId: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!articleId) {
      throw new BadRequestException('articleId query parameter is required');
    }
    return this.commentService.findByArticleId(articleId, {
      sortBy,
      order,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: CommentResponseEntity })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create new comment (admin, editor)' })
  @ApiResponse({ status: 201, type: CommentResponseEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 422,
    description: 'Referenced article does not exist',
  })
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.commentService.create(dto, currentUser);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Update comment (admin or editor — own comment only)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: CommentResponseEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or not owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.commentService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Delete comment (admin or editor — own comment only)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or not owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.commentService.delete(id, currentUser);
  }
}
