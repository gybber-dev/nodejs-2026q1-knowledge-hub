import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGci...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
