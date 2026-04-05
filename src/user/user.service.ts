import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';

type UserResponse = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
  ) {}

  private toResponse(user: User): UserResponse {
    const { password, ...rest } = user;
    return rest;
  }

  findAll(): UserResponse[] {
    return this.users.map((u) => this.toResponse(u));
  }

  findById(id: string): UserResponse {
    const user = this.findRaw(id);
    return this.toResponse(user);
  }

  findRaw(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  create(dto: CreateUserDto): UserResponse {
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      login: dto.login,
      password: dto.password,
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return this.toResponse(user);
  }

  updatePassword(id: string, dto: UpdatePasswordDto): UserResponse {
    const user = this.findRaw(id);

    if (user.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    user.password = dto.newPassword;
    user.updatedAt = Date.now();

    return this.toResponse(user);
  }

  delete(id: string): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    this.articleService.nullifyAuthor(id);
    this.commentService.deleteByAuthorId(id);
    this.users.splice(index, 1);
  }
}
