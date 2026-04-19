import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
