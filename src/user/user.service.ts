import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from '../../generated/prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole as UserRoleEnum } from '../common/enums/user-role.enum';
import {
  ListQuery,
  PaginatedResult,
  parsePrismaListArgs,
} from '../common/utils/list.utils';

type UserResponse = {
  id: string;
  login: string;
  role: string;
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

  async findAll(
    query?: ListQuery,
  ): Promise<UserResponse[] | PaginatedResult<UserResponse>> {
    const { orderBy, skip, take, pagination } = parsePrismaListArgs(
      query ?? {},
    );

    if (pagination) {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({ orderBy, skip, take }),
        this.prisma.user.count(),
      ]);
      return {
        data: users.map((u) => this.toResponse(u)),
        total,
        page: pagination.page,
        limit: pagination.limit,
      };
    }

    const users = await this.prisma.user.findMany({ orderBy });
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
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (existing) {
      throw new BadRequestException(`Login "${dto.login}" is already taken`);
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      parseInt(process.env.CRYPT_SALT ?? '10', 10),
    );

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        role: (dto.role as UserRole) ?? 'viewer',
      },
    });
    return this.toResponse(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: JwtPayload,
  ): Promise<UserResponse> {
    const user = await this.findRaw(id);
    const updateData: Partial<{ password: string; role: UserRole }> = {};

    if (dto.role !== undefined) {
      if (currentUser.role !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException('Only admins can change user roles');
      }
      updateData.role = dto.role as unknown as UserRole;
    }

    if (dto.oldPassword !== undefined || dto.newPassword !== undefined) {
      if (!dto.oldPassword || !dto.newPassword) {
        throw new BadRequestException(
          'Both oldPassword and newPassword are required for password update',
        );
      }

      const passwordValid = await bcrypt.compare(dto.oldPassword, user.password);
      if (!passwordValid) {
        throw new ForbiddenException('Old password is incorrect');
      }

      updateData.password = await bcrypt.hash(
        dto.newPassword,
        parseInt(process.env.CRYPT_SALT ?? '10', 10),
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
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
