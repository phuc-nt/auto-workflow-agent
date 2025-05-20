import { Test, TestingModule } from '@nestjs/testing';
import { MCPInventoryService, AgentType } from './mcp-inventory.service';
import { MCPClientService } from './mcp-client.service';

describe('MCPInventoryService', () => {
  let service: MCPInventoryService;
  let mcpClientService: jest.Mocked<MCPClientService>;

  beforeEach(async () => {
    // Create mock MCPClientService
    const mcpClientServiceMock = {
      readResource: jest.fn(),
      callTool: jest.fn(),
      isConnected: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MCPInventoryService,
        {
          provide: MCPClientService,
          useValue: mcpClientServiceMock,
        },
      ],
    }).compile();

    service = module.get<MCPInventoryService>(MCPInventoryService);
    mcpClientService = module.get(MCPClientService) as jest.Mocked<MCPClientService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInventoryByAgentType', () => {
    beforeEach(() => {
      // Reset the isInitialized flag
      (service as any).isInitialized = false;
    });

    it('should get Jira resources and tools', async () => {
      // Arrange
      const jiraResources = [
        { name: 'issue', description: 'Jira issue', uri: 'jira://issue' },
        { name: 'issues', description: 'Jira issues', uri: 'jira://issues' },
      ];
      
      const jiraTools = [
        { name: 'createIssue', description: 'Create a Jira issue' },
        { name: 'updateIssue', description: 'Update a Jira issue' },
      ];

      mcpClientService.isConnected.mockReturnValue(true);
      
      // Mock successful response for meta resource
      mcpClientService.readResource.mockResolvedValue([{
        text: JSON.stringify({
          resources: jiraResources,
          tools: jiraTools
        })
      }]);

      // Act
      const result = await service.getInventoryByAgentType(AgentType.JIRA);

      // Assert
      expect(mcpClientService.readResource).toHaveBeenCalledWith('meta://');
      expect(result.resources.length).toBeGreaterThan(0);
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.resources.every(r => r.uri.startsWith('jira://'))).toBeTruthy();
    });

    it('should get Confluence resources and tools', async () => {
      // Arrange
      const allResources = [
        { name: 'issue', description: 'Jira issue', uri: 'jira://issue' },
        { name: 'page', description: 'Confluence page', uri: 'confluence://page' },
      ];
      
      const allTools = [
        { name: 'createIssue', description: 'Create a Jira issue' },
        { name: 'createPage', description: 'Create a Confluence page' },
      ];

      mcpClientService.isConnected.mockReturnValue(true);
      
      // Mock successful response for meta resource
      mcpClientService.readResource.mockResolvedValue([{
        text: JSON.stringify({
          resources: allResources,
          tools: allTools
        })
      }]);

      // Act
      const result = await service.getInventoryByAgentType(AgentType.CONFLUENCE);

      // Assert
      expect(mcpClientService.readResource).toHaveBeenCalledWith('meta://');
      expect(result.resources.length).toBeGreaterThan(0);
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.resources.every(r => r.uri.startsWith('confluence://'))).toBeTruthy();
    });

    it('should fall back to known tools when meta does not contain tools info', async () => {
      // Arrange
      const confluenceResources = [
        { name: 'page', description: 'Confluence page', uri: 'confluence://page' },
      ];

      mcpClientService.isConnected.mockReturnValue(true);
      
      // Mock response without tools section
      mcpClientService.readResource.mockResolvedValue([{
        text: JSON.stringify({
          resources: confluenceResources
          // No tools section
        })
      }]);

      // Act
      const result = await service.getInventoryByAgentType(AgentType.CONFLUENCE);

      // Assert
      expect(mcpClientService.readResource).toHaveBeenCalledWith('meta://');
      expect(result.tools.length).toBeGreaterThan(0); // Should have fallback tools
    });

    it('should handle meta resource reading errors', async () => {
      // Arrange
      mcpClientService.isConnected.mockReturnValue(true);
      mcpClientService.readResource.mockRejectedValue(new Error('Failed to read'));

      // Act & Assert
      await expect(service.getInventoryByAgentType(AgentType.JIRA))
        .rejects
        .toThrow('Failed to read');
    });

    it('should handle invalid agent type', async () => {
      // Act & Assert
      await expect(service.getInventoryByAgentType('INVALID' as AgentType))
        .rejects
        .toThrow('Không hỗ trợ agent type');
    });
  });

  describe('getAllResources and getAllTools', () => {
    it('should return all cached resources and tools', async () => {
      // Arrange - populate the cache
      const resources = [
        { name: 'res1', description: 'Resource 1', uri: 'jira://res1' },
        { name: 'res2', description: 'Resource 2', uri: 'confluence://res2' }
      ];
      
      const tools = [
        { name: 'tool1', description: 'Tool 1' },
        { name: 'tool2', description: 'Tool 2' }
      ];

      // Manually populate the cache
      resources.forEach(res => {
        (service as any).resourcesCache.set(res.name, res);
      });
      
      tools.forEach(tool => {
        (service as any).toolsCache.set(tool.name, tool);
      });

      // Act
      const allResources = service.getAllResources();
      const allTools = service.getAllTools();

      // Assert
      expect(allResources).toHaveLength(resources.length);
      expect(allTools).toHaveLength(tools.length);
      expect(allResources).toEqual(expect.arrayContaining(resources));
      expect(allTools).toEqual(expect.arrayContaining(tools));
    });
  });
});
