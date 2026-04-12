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
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseEntity } from './entities/comment-response.entity';

@ApiTags('comments')
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
  @ApiResponse({
    status: 200,
    description: 'List of comments for the article',
    type: CommentResponseEntity,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'articleId is missing or invalid' })
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
  @ApiResponse({
    status: 200,
    description: 'Comment found',
    type: CommentResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new comment' })
  @ApiResponse({
    status: 201,
    description: 'Comment created',
    type: CommentResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 422,
    description: 'Referenced article does not exist',
  })
  create(@Body() dto: CreateCommentDto) {
    return this.commentService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentService.delete(id);
  }
}
