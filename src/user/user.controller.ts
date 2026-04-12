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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseEntity } from './entities/user-response.entity';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
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
    description: 'List of all users',
    type: UserResponseEntity,
    isArray: true,
  })
  async findAll(
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll({ sortBy, order, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: UserResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: "Update user's password" })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Password updated',
    type: UserResponseEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 403, description: 'Old password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.delete(id);
  }
}
