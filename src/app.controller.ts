import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Service greeting' })
  @ApiResponse({ status: 200, description: 'Knowledge Hub greeting payload' })
  root() {
    return {
      name: 'Knowledge Hub API',
      docs: '/doc',
    };
  }
}