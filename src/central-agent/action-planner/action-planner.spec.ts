import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlanner } from './action-planner.service';
import { OpenaiService } from '../../openai/openai.service';
import { StepStatus, PlanStatus, AgentType } from '../models/action-plan.model';

describe('ActionPlanner', () => {
  let actionPlanner: ActionPlanner;
  let openaiService: jest.Mocked<OpenaiService>;

  beforeEach(async () => {
    const openaiServiceMock = {
      chatWithFunctionCalling: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionPlanner,
        {
          provide: OpenaiService,
          useValue: openaiServiceMock,
        },
      ],
    }).compile();

    actionPlanner = module.get<ActionPlanner>(ActionPlanner);
    openaiService = module.get(OpenaiService);
  });

  it('should be defined', () => {
    expect(actionPlanner).toBeDefined();
  });

  it('should create a simple plan', async () => {
    // Mock response từ OpenAI
    openaiService.chatWithFunctionCalling.mockResolvedValue(JSON.stringify({
      steps: [
        {
          id: 'step1',
          agentType: 'JIRA',
          prompt: 'Tìm kiếm task của user',
          dependsOn: [],
          condition: null,
          maxRetries: 2,
          timeout: 15000
        }
      ]
    }));

    const processedInput = 'Người dùng Phúc muốn báo cáo rằng họ đã hoàn thành task hôm nay...';
    
    const plan = await actionPlanner.createPlan(processedInput);
    
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].agentType).toBe(AgentType.JIRA);
    expect(plan.status).toBe(PlanStatus.CREATED);
    expect(plan.steps[0].status).toBe(StepStatus.PENDING);
    expect(openaiService.chatWithFunctionCalling).toHaveBeenCalled();
  });

  it('should handle dependencies between steps', async () => {
    // Mock response với các bước phụ thuộc
    openaiService.chatWithFunctionCalling.mockResolvedValue(JSON.stringify({
      steps: [
        {
          id: 'step1',
          agentType: 'JIRA',
          prompt: 'Tìm kiếm task của user',
          dependsOn: [],
          maxRetries: 2,
          timeout: 15000
        },
        {
          id: 'step2',
          agentType: 'JIRA',
          prompt: 'Cập nhật trạng thái task',
          dependsOn: ['step1'],
          maxRetries: 2,
          timeout: 15000
        },
        {
          id: 'step3',
          agentType: 'SLACK',
          prompt: 'Thông báo cho team',
          dependsOn: ['step2'],
          maxRetries: 2,
          timeout: 15000
        }
      ]
    }));
    
    const processedInput = 'Người dùng muốn cập nhật task và thông báo cho team...';
    
    const plan = await actionPlanner.createPlan(processedInput);
    
    expect(plan.steps.length).toBe(3);
    expect(plan.steps[1].dependsOn).toContain('step1');
    expect(plan.steps[2].dependsOn).toContain('step2');
  });

  it('should add execution conditions', async () => {
    // Mock response với điều kiện thực thi
    openaiService.chatWithFunctionCalling.mockResolvedValue(JSON.stringify({
      steps: [
        {
          id: 'step1',
          agentType: 'JIRA',
          prompt: 'Tìm task của user',
          dependsOn: [],
          maxRetries: 2,
          timeout: 15000
        },
        {
          id: 'step2',
          agentType: 'JIRA',
          prompt: 'Cập nhật trạng thái task',
          dependsOn: ['step1'],
          condition: 'result.step1.data.issues.length > 0',
          maxRetries: 2,
          timeout: 15000
        }
      ]
    }));
    
    const processedInput = 'Người dùng muốn tìm task và cập nhật nếu có...';
    
    const plan = await actionPlanner.createPlan(processedInput);
    
    const updateStep = plan.steps.find(s => s.prompt.includes('Cập nhật'));
    
    expect(updateStep.condition).toBeTruthy();
    expect(updateStep.condition).toContain('length > 0');
  });

  it('should handle invalid LLM responses', async () => {
    // Mock response không hợp lệ
    openaiService.chatWithFunctionCalling.mockResolvedValue('Invalid response without JSON');
    
    const processedInput = 'Some input';
    
    await expect(
      actionPlanner.createPlan(processedInput)
    ).rejects.toThrow('Không thể tạo kế hoạch');
  });

  it('should validate agent types', async () => {
    // Mock response với agent type không hợp lệ
    openaiService.chatWithFunctionCalling.mockResolvedValue(JSON.stringify({
      steps: [
        {
          id: 'step1',
          agentType: 'INVALID_AGENT',
          prompt: 'Do something',
          dependsOn: [],
          maxRetries: 2,
          timeout: 15000
        }
      ]
    }));
    
    const processedInput = 'Some input';
    
    await expect(
      actionPlanner.createPlan(processedInput)
    ).rejects.toThrow('Agent type không hợp lệ');
  });

  it('should validate steps array', async () => {
    // Mock response thiếu steps
    openaiService.chatWithFunctionCalling.mockResolvedValue(JSON.stringify({
      someOtherField: 'value'
    }));
    
    const processedInput = 'Some input';
    
    await expect(
      actionPlanner.createPlan(processedInput)
    ).rejects.toThrow('Thiếu hoặc định dạng steps không đúng');
  });
}); 