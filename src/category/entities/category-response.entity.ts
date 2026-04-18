import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Backend' })
  name: string;

  @ApiProperty({ example: 'Articles about backend development' })
  description: string;
}
