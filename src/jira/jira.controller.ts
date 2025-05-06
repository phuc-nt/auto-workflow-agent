import { Controller, Get, Post, Put, Body, Param, Query, Res } from '@nestjs/common';
import { JiraService } from './jira.service';
import { IssueData, ChatMessage } from './interfaces';
import { Response } from 'express';

@Controller('jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Post('chat')
  async chatJira(
    @Body() requestBody: { messages?: ChatMessage[] },
    @Res() response: Response
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    
    await this.jiraService.chatJiraStream(requestBody.messages, response);
  }

  @Get('user/:projectIdOrKey')
  async getUserData(@Param('projectIdOrKey') projectIdOrKey: string) {
    return this.jiraService.getUserData(projectIdOrKey);
  }

  @Get('issues')
  async searchIssuesUsingPlainText(@Query('query') query: string) {
    return this.jiraService.searchIssuesUsingPlainText(query);
  }

  @Get('issues/jql')
  async searchIssuesUsingJQL(@Query('jql') jql: string) {
    return this.jiraService.searchIssuesUsingJQL(jql);
  }

  @Get('issue/:issueIdOrKey')
  async getIssueDetails(@Param('issueIdOrKey') issueIdOrKey: string) {
    return this.jiraService.getIssueDetails(issueIdOrKey);
  }

  @Get('issue/createmeta/issue-type/:projectIdOrKey')
  async getIssueTypeCreationMeta(
    @Param('projectIdOrKey') projectIdOrKey: string,
  ) {
    return this.jiraService.getIssueTypeCreationMeta(projectIdOrKey);
  }
  @Get('issue/createmeta/field/:projectIdOrKey/:issueTypeId')
  async getIssueCreationMeta(
    @Param('projectIdOrKey') projectIdOrKey: string,
    @Param('issueTypeId') issueTypeId: string,
  ) {
    return this.jiraService.getIssueCreationMeta(projectIdOrKey, issueTypeId);
  }

  @Get('projects')
  async getProjects() {
    return this.jiraService.getProjects();
  }
  @Post('issue')
  async createIssue(@Body() issueData: IssueData) {
    return this.jiraService.createIssue(issueData);
  }

  @Get('issue/:issueIdOrKey/transitions')
  async getIssueTransitions(@Param('issueIdOrKey') issueIdOrKey: string) {
    return this.jiraService.getIssueTransitions(issueIdOrKey);
  }
  
  @Post('issue/:issueIdOrKey/transitions')
  async transitionIssue(
    @Param('issueIdOrKey') issueIdOrKey: string,
    @Body() transitionData: { transition: { id: string } }
  ) {
    return this.jiraService.transitionIssue(issueIdOrKey, transitionData.transition.id);
  }

  @Put('issue/:issueIdOrKey/assignee')
  async assignIssue(
    @Param('issueIdOrKey') issueIdOrKey: string,
    @Body() assigneeData: { accountId: string }
  ) {
    return this.jiraService.assignIssue(issueIdOrKey, assigneeData.accountId);
  }
}
