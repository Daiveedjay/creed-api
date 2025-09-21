import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
  constructor() {}

  @Get()
  homeController(): string {
    return 'Creed API from CI/CD is live';
  }
}
