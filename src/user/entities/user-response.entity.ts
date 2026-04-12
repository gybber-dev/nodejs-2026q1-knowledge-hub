import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserResponseEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  login: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VIEWER })
  role: UserRole;

  @ApiProperty({ example: 1655000000 })
  createdAt: number;

  @ApiProperty({ example: 1655000000 })
  updatedAt: number;
}
