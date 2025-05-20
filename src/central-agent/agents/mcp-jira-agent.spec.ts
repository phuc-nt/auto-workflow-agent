import { Test, TestingModule } from '@nestjs/testing';
import { MCPJiraAgent } from './mcp-jira-agent';
import { JiraMCPService } from '../../mcp-client/jira-mcp.service';
import { PromptAnalyzerService } from '../prompt-analyzer/prompt-analyzer.service';
import { AgentType } from '../../mcp-client/mcp-inventory.service';
import { MCPClientService } from '../../mcp-client/mcp-client.service';

describe('MCPJiraAgent Integration', () => {
  let agent: MCPJiraAgent;
  let jiraMCPService: JiraMCPService;
  let promptAnalyzer: PromptAnalyzerService;
  let mcpClientService: MCPClientService;

  beforeEach(async () => {
    // Create the test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MCPJiraAgent,
        {
          provide: JiraMCPService,
          useValue: {
            getIssues: jest.fn(),
            createIssue: jest.fn(),
            updateIssue: jest.fn(),
            addComment: jest.fn(),
            addWorklog: jest.fn(),
            mcpClient: {
              readResource: jest.fn(),
              callTool: jest.fn()
            }
          }
        },
        {
          provide: PromptAnalyzerService,
          useValue: {
            analyzePrompt: jest.fn()
          }
        }
      ],
    }).compile();

    agent = module.get<MCPJiraAgent>(MCPJiraAgent);
    jiraMCPService = module.get<JiraMCPService>(JiraMCPService);
    promptAnalyzer = module.get<PromptAnalyzerService>(PromptAnalyzerService);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  describe('executePrompt', () => {
    it('should use LLM analysis for reading resources', async () => {
      // Arrange
      const prompt = 'Get all issues from project ABC';
      
      // Mock the prompt analyzer to return a readResource action
      (promptAnalyzer.analyzePrompt as jest.Mock).mockResolvedValue({
        action: 'readResource',
        resourceOrTool: 'jira://issues',
        parameters: { jql: 'project = ABC' },
        confidence: 0.9,
        originalPrompt: prompt
      });

      // Mock the Jira service to return issues
      (jiraMCPService.getIssues as jest.Mock).mockResolvedValue([
        { id: '123', key: 'ABC-1', summary: 'Issue 1' },
        { id: '456', key: 'ABC-2', summary: 'Issue 2' }
      ]);

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.JIRA);
      expect(jiraMCPService.getIssues).toHaveBeenCalledWith('project = ABC');
      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(2);
    });

    it('should use LLM analysis for calling tools', async () => {
      // Arrange
      const prompt = 'Create a bug in project ABC with summary "Login not working"';
      
      // Mock the prompt analyzer to return a callTool action
      (promptAnalyzer.analyzePrompt as jest.Mock).mockResolvedValue({
        action: 'callTool',
        resourceOrTool: 'createIssue',
        parameters: {
          projectKey: 'ABC',
          summary: 'Login not working',
          description: 'Users cannot log in',
          issueType: 'Bug'
        },
        confidence: 0.95,
        originalPrompt: prompt
      });

      // Mock the Jira service to return a new issue
      (jiraMCPService.createIssue as jest.Mock).mockResolvedValue({
        id: '789',
        key: 'ABC-3',
        summary: 'Login not working'
      });

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.JIRA);
      expect(jiraMCPService.createIssue).toHaveBeenCalledWith(
        'ABC', 'Login not working', 'Users cannot log in', 'Bug'
      );
      expect(result.success).toBe(true);
      expect(result.data.issue.key).toBe('ABC-3');
    });

    it('should fall back to regex parsing when confidence is low', async () => {
      // Arrange
      const prompt = 'Get issues from project ABC';
      
      // Mock the prompt analyzer to return low confidence
      (promptAnalyzer.analyzePrompt as jest.Mock).mockResolvedValue({
        action: 'readResource',
        resourceOrTool: 'jira://issues',
        parameters: { jql: 'project = ABC' },
        confidence: 0.5, // Low confidence
        originalPrompt: prompt
      });

      // Mock the Jira service to return issues
      (jiraMCPService.getIssues as jest.Mock).mockResolvedValue([
        { id: '123', key: 'ABC-1', summary: 'Issue 1' }
      ]);

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.JIRA);
      expect(jiraMCPService.getIssues).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle errors during prompt analysis', async () => {
      // Arrange
      const prompt = 'Some invalid prompt';
      
      // Mock the prompt analyzer to throw an error
      (promptAnalyzer.analyzePrompt as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.JIRA);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Analysis failed');
    });
  });
});
