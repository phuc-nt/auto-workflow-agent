import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Response } from 'express';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('stream')
  async getChatStream(@Body() body: { message: string }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await this.slackService.processUserRequest(body.message);  
    stream.pipe(res); // Trả về stream response
  }
}

