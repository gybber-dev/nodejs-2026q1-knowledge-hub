import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../../generated/prisma/client';

type TokenPair = { accessToken: string; refreshToken: string };

type SignupResponse = {
  id: string;
  login: string;
  role: string;
  createdAt: number;
  updatedAt: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<SignupResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (existing) {
      throw new BadRequestException(`Login "${dto.login}" is already taken`);
    }

    // First user on a clean DB becomes admin (bootstrap)
    const count = await this.prisma.user.count();
    const role: UserRole = count === 0 ? UserRole.ADMIN : UserRole.VIEWER;

    const hashedPassword = await bcrypt.hash(
      dto.password,
      parseInt(process.env.CRYPT_SALT ?? '10', 10),
    );

    const user = await this.prisma.user.create({
      data: { login: dto.login, password: hashedPassword, role },
    });

    return this.toSignupResponse(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user) {
      throw new ForbiddenException('Login or password is incorrect');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new ForbiddenException('Login or password is incorrect');
    }

    const tokens = this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  async refresh(dto: { refreshToken?: string }): Promise<TokenPair> {
    if (!dto?.refreshToken || typeof dto.refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_SECRET_REFRESH_KEY,
      });
    } catch {
      throw new ForbiddenException('Refresh token is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== dto.refreshToken) {
      throw new ForbiddenException('Refresh token is invalid or expired');
    }

    const tokens = this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private generateTokens(user: User): TokenPair {
    const payload: JwtPayload = {
      userId: user.id,
      login: user.login,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: process.env.TOKEN_EXPIRE_TIME ?? '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_REFRESH_KEY,
      expiresIn: process.env.TOKEN_REFRESH_EXPIRE_TIME ?? '24h',
    });

    return { accessToken, refreshToken };
  }

  private toSignupResponse(user: User): SignupResponse {
    return {
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  async validateRefreshToken(token: string): Promise<void> {
    try {
      this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_REFRESH_KEY,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is missing or invalid');
    }
  }
}
