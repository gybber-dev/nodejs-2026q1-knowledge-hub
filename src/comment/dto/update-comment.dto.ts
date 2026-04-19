import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Updated comment text' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}
