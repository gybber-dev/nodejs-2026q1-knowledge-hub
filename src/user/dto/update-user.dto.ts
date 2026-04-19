import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'oldSecret123' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  oldPassword?: string;

  @ApiPropertyOptional({ example: 'newSecret456' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  newPassword?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
