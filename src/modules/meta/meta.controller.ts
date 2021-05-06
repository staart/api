import { Controller, Get, HttpStatus, Redirect } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller()
@Public()
export class MetaController {
  constructor() {}

  /** Redirect to staart/staart */
  @Get()
  @Redirect('https://github.com/staart/staart', HttpStatus.FOUND)
  get() {}
}
