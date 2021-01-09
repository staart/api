import { Controller, Get, HttpStatus, Redirect } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller()
@Public()
export class MetaController {
  constructor() {}

  /** Redirect to staart/staart */
  @Get()
  @Redirect('https://github.com/staart/staart', HttpStatus.FOUND)
  get() {}
}
