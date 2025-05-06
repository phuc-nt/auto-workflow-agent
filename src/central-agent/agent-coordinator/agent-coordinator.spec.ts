import { Test, TestingModule } from '@nestjs/testing';
import { AgentCoordinator } from './agent-coordinator.service';
import { ActionPlan, ActionStep, AgentType, PlanStatus, StepStatus } from '../models/action-plan.model';
import { AgentFactory, MockJiraAgent, MockSlackAgent } from '../agent-factory/agent-factory.service';

// Mock logger
jest.mock('../../utils/logger', () => ({
  EnhancedLogger: {
    getLogger: jest.fn().mockReturnValue({
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    })
  }
}));

describe('AgentCoordinator', () => {
  let service: AgentCoordinator;
  let mockJiraAgent: MockJiraAgent;
  let mockSlackAgent: MockSlackAgent;
  let agentFactory: AgentFactory;

  beforeEach(async () => {
    // Tạo các mock agent và factory
    mockJiraAgent = {
      executePrompt: jest.fn()
    } as any;
    
    mockSlackAgent = {
      executePrompt: jest.fn()
    } as any;
    
    // Tạo mock cho AgentFactory
    agentFactory = {
      getAgent: jest.fn((agentType) => {
        if (agentType === AgentType.JIRA) return mockJiraAgent;
        if (agentType === AgentType.SLACK) return mockSlackAgent;
        return { executePrompt: jest.fn() } as any;
      })
    } as any;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentCoordinator,
        {
          provide: AgentFactory,
          useValue: agentFactory
        }
      ],
    }).compile();

    service = module.get<AgentCoordinator>(AgentCoordinator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  describe('executePlan', () => {
    it('should execute a simple plan successfully', async () => {
      // Tạo kế hoạch đơn giản với một bước
      const plan: ActionPlan = createMockPlan([
        {
          id: 'step1',
          agentType: AgentType.JIRA,
          prompt: 'Tìm các task của người dùng',
          dependsOn: [],
        }
      ]);
      
      // Mock JIRA agent để luôn thành công
      mockJiraAgent.executePrompt.mockResolvedValue({
        success: true,
        data: { message: 'Đã thực hiện thành công' }
      });
      
      const result = await service.executePlan(plan);
      
      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(result.steps[0].status).toBe(StepStatus.SUCCEEDED);
      expect(result.overallProgress).toBe(100);
      expect(mockJiraAgent.executePrompt).toHaveBeenCalledTimes(1);
      expect(mockJiraAgent.executePrompt).toHaveBeenCalledWith(
        'Tìm các task của người dùng',
        expect.any(Object)
      );
    });
    
    it('should handle dependencies between steps', async () => {
      // Tạo kế hoạch với hai bước, bước 2 phụ thuộc vào bước 1
      const plan: ActionPlan = createMockPlan([
        {
          id: 'step1',
          agentType: AgentType.JIRA,
          prompt: 'Tìm các task của người dùng',
          dependsOn: [],
        },
        {
          id: 'step2',
          agentType: AgentType.SLACK,
          prompt: 'Gửi thông báo về các task',
          dependsOn: ['step1'],
        }
      ]);
      
      // Mock các agent để luôn thành công
      mockJiraAgent.executePrompt.mockResolvedValue({
        success: true,
        data: { message: 'Đã tìm thấy task' }
      });
      
      mockSlackAgent.executePrompt.mockResolvedValue({
        success: true,
        data: { message: 'Đã gửi thông báo' }
      });
      
      const result = await service.executePlan(plan);
      
      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(result.steps[0].status).toBe(StepStatus.SUCCEEDED);
      expect(result.steps[1].status).toBe(StepStatus.SUCCEEDED);
      expect(result.overallProgress).toBe(100);
      
      // Kiểm tra thứ tự gọi agent
      expect(mockJiraAgent.executePrompt).toHaveBeenCalledTimes(1);
      expect(mockSlackAgent.executePrompt).toHaveBeenCalledTimes(1);
      
      // Kiểm tra tuần tự thực hiện
      const jiraCall = mockJiraAgent.executePrompt.mock.invocationCallOrder[0];
      const slackCall = mockSlackAgent.executePrompt.mock.invocationCallOrder[0];
      expect(jiraCall).toBeLessThan(slackCall);
    });
    
    it('should skip steps when condition evaluates to false', async () => {
      // Tạo kế hoạch với hai bước, bước 2 có điều kiện
      const plan: ActionPlan = createMockPlan([
        {
          id: 'step1',
          agentType: AgentType.JIRA,
          prompt: 'Tìm các task của người dùng',
          dependsOn: [],
        },
        {
          id: 'step2',
          agentType: AgentType.SLACK,
          prompt: 'Gửi thông báo về các task',
          dependsOn: ['step1'],
          condition: 'false', // Luôn false để test
        }
      ]);
      
      // Mock JIRA agent để luôn thành công
      mockJiraAgent.executePrompt.mockResolvedValue({
        success: true,
        data: { message: 'Đã thực hiện thành công' }
      });
      
      const result = await service.executePlan(plan);
      
      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(result.steps[0].status).toBe(StepStatus.SUCCEEDED);
      expect(result.steps[1].status).toBe(StepStatus.SKIPPED);
      expect(result.overallProgress).toBe(100);
      
      // Kiểm tra chỉ có agent đầu tiên được gọi
      expect(mockJiraAgent.executePrompt).toHaveBeenCalledTimes(1);
      expect(mockSlackAgent.executePrompt).not.toHaveBeenCalled();
    });
    
    it('should handle failed steps and retry', async () => {
      // Tạo kế hoạch với một bước có maxRetries = 1
      const plan: ActionPlan = createMockPlan([
        {
          id: 'step1',
          agentType: AgentType.JIRA,
          prompt: 'Tìm các task của người dùng',
          dependsOn: [],
          maxRetries: 1,
        }
      ]);
      
      // Mock JIRA agent để thất bại lần đầu, thành công lần thứ 2
      mockJiraAgent.executePrompt
        .mockResolvedValueOnce({
          success: false,
          error: { code: 'TEST_ERROR', message: 'Test error' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { message: 'Đã thực hiện thành công sau khi retry' }
        });
      
      const result = await service.executePlan(plan);
      
      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(result.steps[0].status).toBe(StepStatus.SUCCEEDED);
      expect(result.steps[0].retryCount).toBe(1);
      expect(mockJiraAgent.executePrompt).toHaveBeenCalledTimes(2);
    });
    
    it('should render prompt templates correctly', async () => {
      // Tạo kế hoạch với 2 bước, bước 2 sử dụng kết quả từ bước 1
      const plan: ActionPlan = createMockPlan([
        {
          id: 'step1',
          agentType: AgentType.JIRA,
          prompt: 'Tìm các task của người dùng',
          dependsOn: [],
        },
        {
          id: 'step2',
          agentType: AgentType.SLACK,
          prompt: 'Gửi thông báo về {result.step1.data.count} task',
          dependsOn: ['step1'],
        }
      ]);
      
      // Mock kết quả từ các agent
      mockJiraAgent.executePrompt.mockResolvedValue({
        success: true,
        data: { count: 5, message: 'Đã tìm thấy 5 task' }
      });
      
      mockSlackAgent.executePrompt.mockResolvedValue({
        success: true,
        data: { message: 'Đã gửi thông báo' }
      });
      
      await service.executePlan(plan);
      
      // Kiểm tra xem prompt đã được render đúng chưa
      expect(mockSlackAgent.executePrompt).toHaveBeenCalledWith(
        'Gửi thông báo về 5 task',
        expect.any(Object)
      );
    });
  });
});

// Utility function để tạo mock ActionPlan
function createMockPlan(stepConfigs: Partial<ActionStep>[]): ActionPlan {
  return {
    steps: stepConfigs.map((config, index) => ({
      id: config.id || `step${index + 1}`,
      agentType: config.agentType || AgentType.JIRA,
      prompt: config.prompt || 'Default prompt',
      dependsOn: config.dependsOn || [],
      condition: config.condition,
      maxRetries: config.maxRetries || 2,
      retryCount: 0,
      timeout: config.timeout || 15000,
      status: StepStatus.PENDING,
    })),
    currentStepIndex: 0,
    executionContext: {},
    status: PlanStatus.CREATED,
    overallProgress: 0,
  };
} 