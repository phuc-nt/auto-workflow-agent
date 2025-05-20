import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MCPClientService } from './mcp-client.service';
import { MCPClientError } from './interfaces/mcp-client.interface';

jest.mock('@modelcontextprotocol/sdk/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    readResource: jest.fn(),
    callTool: jest.fn(),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/client/stdio', () => ({
  StdioClientTransport: jest.fn(),
}));

describe('MCPClientService', () => {
  let service: MCPClientService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MCPClientService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'MCP_SERVER_PATH':
                  return '/path/to/server.js';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MCPClientService>(MCPClientService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const connectSpy = jest.spyOn(service['client'], 'connect');
      await service.connect();
      expect(connectSpy).toHaveBeenCalled();
      expect(service['isInitialized']).toBe(true);
    });

    it('should not connect if already initialized', async () => {
      service['isInitialized'] = true;
      const connectSpy = jest.spyOn(service['client'], 'connect');
      await service.connect();
      expect(connectSpy).not.toHaveBeenCalled();
    });

    it('should throw MCPClientError on connection failure', async () => {
      const error = new Error('Connection failed');
      jest.spyOn(service['client'], 'connect').mockRejectedValue(error);
      
      await expect(service.connect()).rejects.toThrow(MCPClientError);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      service['isInitialized'] = true;
      const disconnectSpy = jest.spyOn(service['client'], 'disconnect');
      await service.disconnect();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(service['isInitialized']).toBe(false);
    });

    it('should not disconnect if not initialized', async () => {
      service['isInitialized'] = false;
      const disconnectSpy = jest.spyOn(service['client'], 'disconnect');
      await service.disconnect();
      expect(disconnectSpy).not.toHaveBeenCalled();
    });

    it('should throw MCPClientError on disconnection failure', async () => {
      service['isInitialized'] = true;
      const error = new Error('Disconnection failed');
      jest.spyOn(service['client'], 'disconnect').mockRejectedValue(error);
      
      await expect(service.disconnect()).rejects.toThrow(MCPClientError);
    });
  });

  describe('readResource', () => {
    it('should read resource successfully', async () => {
      service['isInitialized'] = true;
      const mockResource = [{ text: 'test' }];
      jest.spyOn(service['client'], 'readResource').mockResolvedValue(mockResource);
      
      const result = await service.readResource('test://uri');
      expect(result).toEqual(mockResource);
    });

    it('should throw error if not initialized', async () => {
      service['isInitialized'] = false;
      await expect(service.readResource('test://uri')).rejects.toThrow(MCPClientError);
    });
  });

  describe('callTool', () => {
    it('should call tool successfully', async () => {
      service['isInitialized'] = true;
      const mockResult = { content: [{ text: 'success' }] };
      jest.spyOn(service['client'], 'callTool').mockResolvedValue(mockResult);
      
      const result = await service.callTool('testTool', { param: 'value' });
      expect(result).toEqual(mockResult);
    });

    it('should throw error if not initialized', async () => {
      service['isInitialized'] = false;
      await expect(service.callTool('testTool', {})).rejects.toThrow(MCPClientError);
    });
  });

  describe('isConnected', () => {
    it('should return true when initialized', () => {
      service['isInitialized'] = true;
      expect(service.isConnected()).toBe(true);
    });

    it('should return false when not initialized', () => {
      service['isInitialized'] = false;
      expect(service.isConnected()).toBe(false);
    });
  });
});
