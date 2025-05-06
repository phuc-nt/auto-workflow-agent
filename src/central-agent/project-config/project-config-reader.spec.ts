import { Test, TestingModule } from '@nestjs/testing';
import { ProjectConfigReader } from './project-config-reader.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock('path', () => ({
  resolve: jest.fn(),
}));

describe('ProjectConfigReader', () => {
  let service: ProjectConfigReader;
  
  const mockConfig = {
    jira: {
      domain: 'https://test.atlassian.net',
      projectKey: 'TEST',
    },
    projectMembers: [
      {
        name: 'Test User',
        email: 'test@example.com',
        jiraAccountId: '123456',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectConfigReader],
    }).compile();

    service = module.get<ProjectConfigReader>(ProjectConfigReader);
    
    // Mock path.resolve
    jest.spyOn(path, 'resolve').mockReturnValue('/mock/path/to/config.json');
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read config file and cache it', async () => {
    // Mock fs.promises.readFile
    const readFileMock = jest.spyOn(fs.promises, 'readFile')
      .mockResolvedValue(JSON.stringify(mockConfig));
    
    // First call should read the file
    const config1 = await service.getProjectConfig();
    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(config1).toEqual(mockConfig);
    
    // Second call should use cache
    const config2 = await service.getProjectConfig();
    expect(readFileMock).toHaveBeenCalledTimes(1); // Still called only once
    expect(config2).toEqual(mockConfig);
  });

  it('should clear cache when clearCache is called', async () => {
    // Mock fs.promises.readFile
    const readFileMock = jest.spyOn(fs.promises, 'readFile')
      .mockResolvedValue(JSON.stringify(mockConfig));
    
    // First call
    await service.getProjectConfig();
    
    // Clear cache
    service.clearCache();
    
    // Second call should read file again
    await service.getProjectConfig();
    expect(readFileMock).toHaveBeenCalledTimes(2);
  });

  it('should throw error when file read fails', async () => {
    // Mock fs.promises.readFile to throw
    jest.spyOn(fs.promises, 'readFile')
      .mockRejectedValue(new Error('File not found'));
    
    await expect(service.getProjectConfig()).rejects
      .toThrow('Failed to read project config: File not found');
  });
}); 