import { Test, TestingModule } from '@nestjs/testing';
import { MCPConfluenceAgent } from './mcp-confluence-agent';
import { ConfluenceMCPService } from '../../mcp-client/confluence-mcp.service';
import { PromptAnalyzerService } from '../prompt-analyzer/prompt-analyzer.service';
import { AgentType } from '../../mcp-client/mcp-inventory.service';

describe('MCPConfluenceAgent Integration', () => {
  let agent: MCPConfluenceAgent;
  let confluenceMCPService: ConfluenceMCPService;
  let promptAnalyzer: PromptAnalyzerService;

  beforeEach(async () => {
    // Create the test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MCPConfluenceAgent,
        {
          provide: ConfluenceMCPService,
          useValue: {
            getPage: jest.fn(),
            createPage: jest.fn(),
            updatePage: jest.fn(),
            searchPages: jest.fn(),
            getChildren: jest.fn(),
            addComment: jest.fn()
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

    agent = module.get<MCPConfluenceAgent>(MCPConfluenceAgent);
    confluenceMCPService = module.get<ConfluenceMCPService>(ConfluenceMCPService);
    promptAnalyzer = module.get<PromptAnalyzerService>(PromptAnalyzerService);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  describe('executePrompt', () => {
    it('should use LLM analysis for getting a page', async () => {
      // Arrange
      const prompt = 'Get page with ID 12345';
      
      // Mock the prompt analyzer to return a readResource action
      (promptAnalyzer.analyzePrompt as jest.Mock).mockResolvedValue({
        action: 'readResource',
        resourceOrTool: 'confluence://pages/12345',
        parameters: { },
        confidence: 0.9,
        originalPrompt: prompt
      });

      // Mock the Confluence service to return a page
      (confluenceMCPService.getPage as jest.Mock).mockResolvedValue({
        id: '12345',
        title: 'Test Page',
        content: '<p>Some content</p>'
      });

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.CONFLUENCE);
      expect(confluenceMCPService.getPage).toHaveBeenCalledWith('12345');
      expect(result.success).toBe(true);
      expect(result.data.page.title).toBe('Test Page');
    });

    it('should use LLM analysis for creating a page', async () => {
      // Arrange
      const prompt = 'Create a page in space DOC with title "Meeting Notes"';
      
      // Mock the prompt analyzer to return a callTool action
      (promptAnalyzer.analyzePrompt as jest.Mock).mockResolvedValue({
        action: 'callTool',
        resourceOrTool: 'createPage',
        parameters: {
          spaceKey: 'DOC',
          title: 'Meeting Notes',
          content: '<p>Meeting notes content</p>',
          parentId: undefined
        },
        confidence: 0.95,
        originalPrompt: prompt
      });

      // Mock the Confluence service to return a new page
      (confluenceMCPService.createPage as jest.Mock).mockResolvedValue({
        id: '67890',
        title: 'Meeting Notes',
        space: { key: 'DOC' }
      });

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.CONFLUENCE);
      expect(confluenceMCPService.createPage).toHaveBeenCalledWith(
        'DOC', 'Meeting Notes', '<p>Meeting notes content</p>', undefined
      );
      expect(result.success).toBe(true);
      expect(result.data.page.title).toBe('Meeting Notes');
    });

    it('should fall back to regex parsing when confidence is low', async () => {
      // Arrange
      const prompt = 'Search pages with query "project plan"';
      
      // Mock the prompt analyzer to return low confidence
      (promptAnalyzer.analyzePrompt as jest.Mock).mockResolvedValue({
        action: 'readResource',
        resourceOrTool: 'confluence://search',
        parameters: { cql: 'text ~ "project plan"' },
        confidence: 0.5, // Low confidence
        originalPrompt: prompt
      });

      // Mock the Confluence service to return search results
      (confluenceMCPService.searchPages as jest.Mock).mockResolvedValue([
        { id: '12345', title: 'Project Plan 2025' }
      ]);

      // Act
      const result = await agent.executePrompt(prompt);

      // Assert
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.CONFLUENCE);
      expect(confluenceMCPService.searchPages).toHaveBeenCalled();
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
      expect(promptAnalyzer.analyzePrompt).toHaveBeenCalledWith(prompt, AgentType.CONFLUENCE);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Analysis failed');
    });
  });
});
