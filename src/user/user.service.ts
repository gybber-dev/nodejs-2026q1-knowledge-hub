import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User, UserRole } from '../../generated/prisma/client';

type UserResponse = Omit<User, 'password' | 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany();
    return users.map((u) => this.toResponse(u));
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.findRaw(id);
    return this.toResponse(user);
  }

  async findRaw(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: dto.password,
        role: (dto.role as UserRole) ?? 'viewer',
      },
    });
    return this.toResponse(user);
  }

  async updatePassword(
    id: string,
    dto: UpdatePasswordDto,
  ): Promise<UserResponse> {
    const user = await this.findRaw(id);

    if (user.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: dto.newPassword },
    });

    return this.toResponse(updated);
  }

  async delete(id: string): Promise<void> {
    await this.findRaw(id);

    await this.prisma.$transaction([
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
}
