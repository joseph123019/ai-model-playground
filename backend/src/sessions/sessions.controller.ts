import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  async getUserSessions(@Request() req) {
    return this.sessionsService.getUserSessions(req.user.id);
  }

  @Get(':id')
  async getSession(@Param('id') id: string, @Request() req) {
    return this.sessionsService.getSessionById(id, req.user.id);
  }
}
