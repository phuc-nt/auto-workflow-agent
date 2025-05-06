import { Test, TestingModule } from '@nestjs/testing';
import { ResultSynthesizerService } from './result-synthesizer.service';
import { OpenaiService } from '../../openai/openai.service';
import { ActionPlan, AgentType, PlanStatus, StepStatus } from '../models/action-plan.model';

describe('ResultSynthesizerService', () => {
  let service: ResultSynthesizerService;
  let openaiService: jest.Mocked<OpenaiService>;

  beforeEach(async () => {
    const openaiServiceMock = {
      chatWithFunctionCalling: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultSynthesizerService,
        { provide: OpenaiService, useValue: openaiServiceMock },
      ],
    }).compile();

    service = module.get<ResultSynthesizerService>(ResultSynthesizerService);
    openaiService = module.get(OpenaiService) as jest.Mocked<OpenaiService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('synthesizeResult', () => {
    it('should return simple result for non-completed plan', async () => {
      // Arrange
      const actionPlan: Partial<ActionPlan> = {
        status: PlanStatus.RUNNING,
        overallProgress: 50,
        steps: [],
      };

      // Act
      const result = await service.synthesizeResult(actionPlan as ActionPlan, 'Test input');

      // Assert
      expect(result).toContain('Kế hoạch thực thi đã running');
      expect(result).toContain('Tiến độ: 50%');
    });

    it('should call OpenAI API and return response for completed plan', async () => {
      // Arrange
      const actionPlan: Partial<ActionPlan> = {
        status: PlanStatus.COMPLETED,
        overallProgress: 100,
        steps: [
          {
            id: 'step1',
            agentType: AgentType.JIRA,
            prompt: 'Test prompt',
            status: StepStatus.SUCCEEDED,
            result: { 
              success: true,
              data: { message: 'Task updated successfully' },
              metadata: {}
            },
            dependsOn: [],
            startTime: new Date(),
            endTime: new Date(),
          },
        ],
        startTime: new Date(),
        endTime: new Date(),
      };

      const expectedResponse = 'Đã hoàn thành cập nhật task thành công';
      openaiService.chatWithFunctionCalling.mockResolvedValue(expectedResponse);

      // Act
      const result = await service.synthesizeResult(actionPlan as ActionPlan, 'Test input');

      // Assert
      expect(openaiService.chatWithFunctionCalling).toHaveBeenCalled();
      expect(result).toBe(expectedResponse);
    });

    it('should handle errors and return fallback message', async () => {
      // Arrange
      const actionPlan: Partial<ActionPlan> = {
        status: PlanStatus.COMPLETED,
        overallProgress: 100,
        steps: [
          {
            id: 'step1',
            agentType: AgentType.JIRA,
            prompt: 'Test prompt',
            status: StepStatus.SUCCEEDED,
            result: { success: true, data: {}, metadata: {} },
            dependsOn: [],
          },
          {
            id: 'step2',
            agentType: AgentType.SLACK,
            prompt: 'Test prompt 2',
            status: StepStatus.SUCCEEDED, 
            result: { success: true, data: {}, metadata: {} },
            dependsOn: [],
          },
        ],
      };

      openaiService.chatWithFunctionCalling.mockRejectedValue(new Error('API error'));

      // Act
      const result = await service.synthesizeResult(actionPlan as ActionPlan, 'Test input');

      // Assert
      expect(result).toContain('Đã thực hiện 2/2 bước thành công');
    });
  });
}); 