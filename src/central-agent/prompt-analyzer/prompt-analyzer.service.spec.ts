import { Test, TestingModule } from '@nestjs/testing';
import { PromptAnalyzerService } from './prompt-analyzer.service';
import { OpenaiService } from '../../openai/openai.service';
import { MCPInventoryService, AgentType } from '../../mcp-client/mcp-inventory.service';

describe('PromptAnalyzerService', () => {
  let service: PromptAnalyzerService;
  let openaiService: jest.Mocked<OpenaiService>;
  let mcpInventoryService: jest.Mocked<MCPInventoryService>;

  beforeEach(async () => {
    // Create mock services
    const openaiServiceMock = {
      chatWithFunctionCalling: jest.fn(),
    };

    const mcpInventoryServiceMock = {
      getInventoryByAgentType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptAnalyzerService,
        {
          provide: OpenaiService,
          useValue: openaiServiceMock,
        },
        {
          provide: MCPInventoryService,
          useValue: mcpInventoryServiceMock,
        },
      ],
    }).compile();

    service = module.get<PromptAnalyzerService>(PromptAnalyzerService);
    openaiService = module.get(OpenaiService) as jest.Mocked<OpenaiService>;
    mcpInventoryService = module.get(MCPInventoryService) as jest.Mocked<MCPInventoryService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzePrompt', () => {
    it('should correctly analyze a resource reading prompt', async () => {
      // Arrange
      const prompt = 'Get all issues from project XYZ';
      const agentType = AgentType.JIRA;
      
      mcpInventoryService.getInventoryByAgentType.mockResolvedValue({
        resources: [{ name: 'issues', description: 'Jira issues', uri: 'jira://issues' }],
        tools: [{ name: 'createIssue', description: 'Create a Jira issue' }]
      });
      
      openaiService.chatWithFunctionCalling.mockResolvedValue(`
        {
          "action": "readResource",
          "resourceOrTool": "jira://issues",
          "parameters": { "jql": "project = XYZ" },
          "confidence": 0.95
        }
      `);

      // Act
      const result = await service.analyzePrompt(prompt, agentType);

      // Assert
      expect(mcpInventoryService.getInventoryByAgentType).toHaveBeenCalledWith(agentType);
      expect(openaiService.chatWithFunctionCalling).toHaveBeenCalled();
      
      expect(result).toEqual({
        action: 'readResource',
        resourceOrTool: 'jira://issues',
        parameters: { jql: 'project = XYZ' },
        confidence: 0.95,
        originalPrompt: prompt
      });
    });

    it('should correctly analyze a tool calling prompt', async () => {
      // Arrange
      const prompt = 'Create a new issue in project XYZ with summary "Fix login bug"';
      const agentType = AgentType.JIRA;
      
      mcpInventoryService.getInventoryByAgentType.mockResolvedValue({
        resources: [{ name: 'issues', description: 'Jira issues', uri: 'jira://issues' }],
        tools: [{ name: 'createIssue', description: 'Create a Jira issue' }]
      });
      
      openaiService.chatWithFunctionCalling.mockResolvedValue(`
        {
          "action": "callTool",
          "resourceOrTool": "createIssue",
          "parameters": { 
            "projectKey": "XYZ", 
            "summary": "Fix login bug",
            "description": "" 
          },
          "confidence": 0.9
        }
      `);

      // Act
      const result = await service.analyzePrompt(prompt, agentType);

      // Assert
      expect(mcpInventoryService.getInventoryByAgentType).toHaveBeenCalledWith(agentType);
      expect(openaiService.chatWithFunctionCalling).toHaveBeenCalled();
      
      expect(result).toEqual({
        action: 'callTool',
        resourceOrTool: 'createIssue',
        parameters: { 
          projectKey: 'XYZ',
          summary: 'Fix login bug',
          description: ''
        },
        confidence: 0.9,
        originalPrompt: prompt
      });
    });

    it('should handle errors in LLM response', async () => {
      // Arrange
      const prompt = 'Some prompt';
      const agentType = AgentType.JIRA;
      
      mcpInventoryService.getInventoryByAgentType.mockResolvedValue({
        resources: [],
        tools: []
      });
      
      openaiService.chatWithFunctionCalling.mockResolvedValue('Not a valid JSON');

      // Act & Assert
      await expect(service.analyzePrompt(prompt, agentType))
        .rejects
        .toThrow('Failed to parse analysis result');
    });

    it('should handle errors during analysis', async () => {
      // Arrange
      const prompt = 'Some prompt';
      const agentType = AgentType.JIRA;
      
      mcpInventoryService.getInventoryByAgentType.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(service.analyzePrompt(prompt, agentType))
        .rejects
        .toThrow('Failed to analyze prompt');
    });
  });
});
