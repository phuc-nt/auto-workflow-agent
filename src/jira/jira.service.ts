import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import {
  IssueType,
  MetaResponseData,
  IssueData,
  RoleData,
  UserData,
  ChatMessage
} from './interfaces';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { JIRA_INSTRUCTION_PROMPT } from '../config/jira.config';
import { Response } from 'express';

@Injectable()
export class JiraService {
  private readonly host: string;
  private readonly email: string;
  private readonly apiToken: string;
  private readonly jiraInstructionPrompt: string;
  private openai: OpenAI;
  private readonly logger = new Logger(JiraService.name);
  private openaiModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.host = this.configService.get<string>('JIRA_HOST');
    this.email = this.configService.get<string>('JIRA_EMAIL');
    this.apiToken = this.configService.get<string>('JIRA_API_TOKEN');

    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.openaiModel = 'gpt-4o';

    // Use the imported instruction prompt and replace any environment variables if needed
    this.jiraInstructionPrompt = JIRA_INSTRUCTION_PROMPT.replace(
      '${JIRA_HOST}',
      this.host,
    );
  }

  async chatJiraStream(userMessages: ChatMessage[], response: Response): Promise<void> {
    try {
      this.logger.log(`Starting new Jira chat stream session with ${userMessages.length} messages`);
      const systemPrompt = this.jiraInstructionPrompt;
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
      ];

      let currentMessages = messages;
      let hasToolCalls = true;
      let iterationCount = 0;

      // Keep processing tool calls until there are none left
      while (hasToolCalls) {
        iterationCount++;
        this.logger.log(`Chat iteration #${iterationCount}: Calling OpenAI API`);

        // Send event that we're calling OpenAI
        response.write(`data: {"type": "progress", "message": "Calling AI model for iteration #${iterationCount}"}\n\n`);

        const openaiResponse = await this.openai.chat.completions.create({
          model: this.openaiModel,
          messages: currentMessages,
          tools: functions.map(func => ({
            type: "function",
            function: func
          })),
          tool_choice: 'auto',
        });

        const responseMessage = openaiResponse.choices[0].message;

        // If no tool calls, return the content directly and end stream
        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
          this.logger.log(`Chat completed with no tool calls required after ${iterationCount} iterations`);
          response.write(`data: {"type": "complete", "message": ${JSON.stringify(responseMessage.content)}}\n\n`);
          response.end();
          return;
        }

        // Process tool calls
        currentMessages = [...currentMessages, responseMessage];
        this.logger.log(`Processing ${responseMessage.tool_calls.length} tool calls in iteration #${iterationCount}`);

        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const functionArgs = JSON.parse(toolCall.function.arguments);

          this.logger.log(`Executing function: ${functionName} with args: ${JSON.stringify(functionArgs)}`);

          // Send event that we're executing a specific function
          response.write(`data: {"type": "function_call", "function": "${functionName}", "args": ${JSON.stringify(functionArgs)}}\n\n`);

          let result;
          if (functionName === 'searchIssues') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.searchIssuesUsingPlainText(functionArgs.query);
            this.logger.log(`searchIssuesUsingPlainText completed with query: "${functionArgs.query}"`);
          } else if (functionName === 'searchIssuesUsingJQL') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.searchIssuesUsingJQL(functionArgs.jql);
            this.logger.log(`searchIssuesUsingJQL completed with JQL: "${functionArgs.jql}"`);
          } else if (functionName === 'getProjects') {
            result = await this.getProjects();
            this.logger.log('getProjects completed');
          } else if (functionName === 'createIssue') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.createIssue(functionArgs);
            this.logger.log(`createIssue completed for project: "${functionArgs.project}" with summary: "${functionArgs.summary}"`);
          } else if (functionName === 'getUserData') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getUserData(functionArgs.projectIdOrKey);
            this.logger.log(`getUserData completed for project: "${functionArgs.projectIdOrKey}"`);
          } else if (functionName === 'getIssueDetails') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueDetails(functionArgs.issueIdOrKey);
            this.logger.log(`getIssueDetails completed for issue: "${functionArgs.issueIdOrKey}"`);
          } else if (functionName === 'getIssueTypeCreationMeta') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueTypeCreationMeta(functionArgs.projectIdOrKey);
            this.logger.log(`getIssueTypeCreationMeta completed for project: "${functionArgs.projectIdOrKey}"`);
          } else if (functionName === 'getIssueCreationMeta') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueCreationMeta(
              functionArgs.projectIdOrKey,
              functionArgs.issueTypeId
            );
            this.logger.log(`getIssueCreationMeta completed for project: "${functionArgs.projectIdOrKey}" and issueType: "${functionArgs.issueTypeId}"`);
          } else if (functionName === 'getIssueTransitions') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.getIssueTransitions(functionArgs.issueIdOrKey);
            this.logger.log(`getIssueTransitions completed for issue: "${functionArgs.issueIdOrKey}"`);
          } else if (functionName === 'transitionIssue') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.transitionIssue(
              functionArgs.issueIdOrKey,
              functionArgs.transitionId
            );
            this.logger.log(`transitionIssue completed for issue: "${functionArgs.issueIdOrKey}" with transitionId: "${functionArgs.transitionId}"`);
          } else if (functionName === 'assignIssue') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.assignIssue(
              functionArgs.issueIdOrKey,
              functionArgs.accountId
            );
            this.logger.log(`assignIssue completed for issue: "${functionArgs.issueIdOrKey}" with accountId: "${functionArgs.accountId}"`);
          } else {
            // Process other functions if any
            this.logger.warn(`Unknown function called: ${functionName}`);
            response.write(`data: {"type": "error", "message": "Unknown function called: ${functionName}"}\n\n`);
            continue;
          }

          // Send event with the function result
          response.write(`data: {"type": "function_result", "function": "${functionName}", "result": ${JSON.stringify(result)}}\n\n`);

          // Add the result to the messages array
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
      }

      // This should never be reached due to the while loop, but fallback
      response.write(`data: {"type": "error", "message": "Unexpected end of processing"}\n\n`);
      response.end();

    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error with function calling: ${error.message}`);
      response.write(`data: {"type": "error", "message": "Error processing request: ${error.message}"}\n\n`);
      response.end();
    }
  }

  async getUserData(projectIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response1: AxiosResponse<RoleData> = await firstValueFrom(
        this.httpService.get(
          `${this.host}/rest/api/3/project/${projectIdOrKey}/role`,
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          },
        ),
      );
      const roles = response1.data;
      const adminRoleId = roles?.Administrator?.split('/')?.pop();
      const memberRoleId = roles?.Member?.split('/')?.pop();

      const adminResponse: AxiosResponse<{ actors: UserData[] }> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/project/${projectIdOrKey}/role/${adminRoleId}`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      const memberResponse: AxiosResponse<{ actors: UserData[] }> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/project/${projectIdOrKey}/role/${memberRoleId}`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      const combinedMembers = [
        ...adminResponse.data.actors,
        ...memberResponse.data.actors,
      ];

      const filteredMembers = combinedMembers.map((user: UserData) => ({
        displayName: user.displayName,
        accountId: user.actorUser.accountId,
      }));

      return filteredMembers;
    } catch (error) {
      this.logger.error(`Error getting user data: ${error.message}`);
      throw new Error('Không thể lấy thông tin người dùng. Vui lòng kiểm tra quyền truy cập.');
    }
  }

  async searchIssues(query: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/issue/picker`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          params: {
            query: query,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error searching issues: ${error.message}`);
      throw new Error('Không thể tìm kiếm các vấn đề. Vui lòng thử lại sau.');
    }
  }

  async searchIssuesUsingPlainText(query: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/issue/picker`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          params: {
            query: query,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error searching issues with plain text: ${error.message}`);
      throw new Error('Không thể tìm kiếm các vấn đề. Vui lòng thử lại sau.');
    }
  }

  async searchIssuesUsingJQL(jql: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/search`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          params: {
            jql: jql,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error searching issues with JQL: ${error.message}`);
      throw new Error('Không thể tìm kiếm với JQL. Vui lòng kiểm tra cú pháp JQL và thử lại.');
    }
  }

  async getIssueDetails(issueIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/issue/${issueIdOrKey}`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting issue details: ${error.message}`);
      throw new Error('Không thể lấy chi tiết vấn đề. Vui lòng kiểm tra ID và quyền truy cập.');
    }
  }

  async createIssue(issueData: IssueData): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Tách dữ liệu cho trường fields
      const fieldsData: any = {
        project: {
          key: issueData.project,
        },
        issuetype: {
          id: issueData.issueTypeId,
        },
        summary: issueData.summary,
        reporter: {
          accountId: issueData.reporterAccountId,
        },
      };

      // Add priority if provided
      if (issueData.priorityName) {
        fieldsData.priority = {
          name: issueData.priorityName
        };
      }

      // Add description if provided
      if (issueData.description) {
        fieldsData.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issueData.description
                }
              ]
            }
          ]
        };
      }
      console.log(JSON.stringify(fieldsData));
      // Tạo issue
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          `${this.host}/rest/api/3/issue`,
          { fields: fieldsData },
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error creating issue: ${error.message}`);
      throw new Error('Không thể tạo vấn đề mới. Vui lòng kiểm tra thông tin đã nhập.');
    }
  }

  async getIssueTypeCreationMeta(projectIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Lấy metadata cần thiết để tạo issue
      const metaResponse: AxiosResponse<MetaResponseData> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/issue/createmeta/${projectIdOrKey}/issuetypes`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      // Trả về metadata của project
      return metaResponse.data;
    } catch (error) {
      this.logger.error(`Error getting issue type metadata: ${error}`);
      // console.log(error);
      throw new Error('Không thể lấy thông tin loại vấn đề. Vui lòng kiểm tra dự án.');
    }
  }

  async getIssueCreationMeta(
    projectIdOrKey: string,
    issueTypeId: string,
  ): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;

      // Lấy metadata cần thiết để tạo issue
      const metaResponse: AxiosResponse<MetaResponseData> =
        await firstValueFrom(
          this.httpService.get(
            `${this.host}/rest/api/3/issue/createmeta/${projectIdOrKey}/issuetypes/${issueTypeId}`,
            {
              headers: {
                Authorization: authHeader,
                Accept: 'application/json',
              },
            },
          ),
        );

      // Trả về metadata của project
      return metaResponse.data;
    } catch (error) {
      this.logger.error(`Error getting issue creation metadata: ${error.message}`);
      throw new Error('Không thể lấy thông tin trường dữ liệu. Vui lòng kiểm tra dự án và loại vấn đề.');
    }
  }

  async getProjects(): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/project/search`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting projects: ${error.message}`);
      throw new Error('Không thể lấy danh sách dự án. Vui lòng kiểm tra quyền truy cập.');
    }
  }

  async getIssueTransitions(issueIdOrKey: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.host}/rest/api/3/issue/${issueIdOrKey}/transitions`, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting issue transitions: ${error.message}`);
      throw new Error('Không thể lấy danh sách trạng thái. Vui lòng kiểm tra issue ID và quyền truy cập.');
    }
  }

  async transitionIssue(issueIdOrKey: string, transitionId: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          `${this.host}/rest/api/3/issue/${issueIdOrKey}/transitions`,
          {
            transition: {
              id: transitionId,
            },
          },
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return { success: true, statusCode: response.status };
    } catch (error) {
      this.logger.error(`Error transitioning issue: ${error.message}`);
      throw new Error('Không thể chuyển trạng thái issue. Vui lòng kiểm tra issue ID, transition ID và quyền truy cập.');
    }
  }

  async assignIssue(issueIdOrKey: string, accountId: string): Promise<any> {
    try {
      const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.put(
          `${this.host}/rest/api/3/issue/${issueIdOrKey}/assignee`,
          {
            accountId: accountId,
          },
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return { success: true, statusCode: response.status };
    } catch (error) {
      this.logger.error(`Error assigning issue: ${error.message}`);
      throw new Error('Không thể gán người dùng cho issue. Vui lòng kiểm tra issue ID, account ID và quyền truy cập.');
    }
  }

}

const functions = [

  {
    name: 'searchIssues',
    description: 'Search for Jira issues by plain text query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for Jira issues',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchIssuesUsingJQL',
    description: 'Search for Jira issues using JQL (Jira Query Language)',
    parameters: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description: 'JQL query string for searching Jira issues',
        },
      },
      required: ['jql'],
    },
  },
  {
    name: 'getProjects',
    description: 'Get list of all accessible Jira projects',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'createIssue',
    description: 'Create a new Jira issue',
    parameters: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project key',
        },
        issueTypeId: {
          type: 'string',
          description: 'Issue type ID',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title',
        },
        reporterAccountId: {
          type: 'string',
          description: 'Account ID of the reporter',
        },
        description: {
          type: 'string',
          description: 'Issue description',
        },
        priorityName: {
          type: 'string',
          description: 'Priority name (e.g., "High", "Medium", "Low")',
        },
      },
      required: ['project', 'issueTypeId', 'summary', 'reporterAccountId'],
    },
  },
  {
    name: 'getUserData',
    description: 'Get user data for a specific Jira project',
    parameters: {
      type: 'object',
      properties: {
        projectIdOrKey: {
          type: 'string',
          description: 'Project ID or key to get user data from',
        },
      },
      required: ['projectIdOrKey'],
    },
  },
  {
    name: 'getIssueDetails',
    description: 'Get detailed information about a specific Jira issue',
    parameters: {
      type: 'object',
      properties: {
        issueIdOrKey: {
          type: 'string',
          description: 'Issue ID or key to get details for',
        },
      },
      required: ['issueIdOrKey'],
    },
  },
  {
    name: 'getIssueTypeCreationMeta',
    description: 'Get metadata about issue types available for a project',
    parameters: {
      type: 'object',
      properties: {
        projectIdOrKey: {
          type: 'string',
          description: 'Project ID or key to get issue type metadata for',
        },
      },
      required: ['projectIdOrKey'],
    },
  },
  {
    name: 'getIssueCreationMeta',
    description: 'Get metadata about fields available for a specific issue type in a project',
    parameters: {
      type: 'object',
      properties: {
        projectIdOrKey: {
          type: 'string',
          description: 'Project ID or key',
        },
        issueTypeId: {
          type: 'string',
          description: 'Issue type ID to get field metadata for',
        },
      },
      required: ['projectIdOrKey', 'issueTypeId'],
    },
  },
  {
    name: 'getIssueTransitions',
    description: 'Get available transitions for a specific Jira issue',
    parameters: {
      type: 'object',
      properties: {
        issueIdOrKey: {
          type: 'string',
          description: 'Issue ID or key to get transitions for',
        },
      },
      required: ['issueIdOrKey'],
    },
  },
  {
    name: 'transitionIssue',
    description: 'Transition a Jira issue to a different status',
    parameters: {
      type: 'object',
      properties: {
        issueIdOrKey: {
          type: 'string',
          description: 'Issue ID or key to transition',
        },
        transitionId: {
          type: 'string',
          description: 'ID of the transition to perform',
        },
      },
      required: ['issueIdOrKey', 'transitionId'],
    },
  },
  {
    name: 'assignIssue',
    description: 'Assign a Jira issue to a user',
    parameters: {
      type: 'object',
      properties: {
        issueIdOrKey: {
          type: 'string',
          description: 'Issue ID or key to assign',
        },
        accountId: {
          type: 'string',
          description: 'Account ID of the user to assign the issue to',
        },
      },
      required: ['issueIdOrKey', 'accountId'],
    },
  }
];