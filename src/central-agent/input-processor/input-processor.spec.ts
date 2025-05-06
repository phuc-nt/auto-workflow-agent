import { Test, TestingModule } from '@nestjs/testing';
import { InputProcessor } from './input-processor.service';
import { OpenaiService } from '../../openai/openai.service';

describe('InputProcessor', () => {
  let inputProcessor: InputProcessor;
  let openaiService: jest.Mocked<OpenaiService>;

  beforeEach(async () => {
    const openaiServiceMock = {
      chatWithFunctionCalling: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InputProcessor,
        {
          provide: OpenaiService,
          useValue: openaiServiceMock,
        },
      ],
    }).compile();

    inputProcessor = module.get<InputProcessor>(InputProcessor);
    openaiService = module.get(OpenaiService);
  });

  it('should be defined', () => {
    expect(inputProcessor).toBeDefined();
  });

  it('should process simple completion request', async () => {
    // Thiết lập mock response
    openaiService.chatWithFunctionCalling.mockResolvedValue(
      'Người dùng Phúc muốn báo cáo rằng họ đã hoàn thành tất cả công việc hôm nay.'
    );

    const userInput = 'tôi xong việc hôm nay rồi';
    const context = {
      user: { name: 'Phúc' },
      project: { key: 'XDEMO2' },
      conversationHistory: [],
    };

    const result = await inputProcessor.processInput(userInput, context);

    expect(result).toContain('hoàn thành');
    expect(result).toContain('Phúc');
    expect(openaiService.chatWithFunctionCalling).toHaveBeenCalled();
  });

  it('should pass correct prompt to OpenAI', async () => {
    // Thiết lập mock
    openaiService.chatWithFunctionCalling.mockResolvedValue('mock response');

    const userInput = 'tạo task mới cho Nam';
    const context = {
      user: { name: 'Phúc' },
      project: { key: 'XDEMO2' },
      conversationHistory: [],
    };

    await inputProcessor.processInput(userInput, context);

    // Check that the first arg contains system prompt
    const systemPromptArg = openaiService.chatWithFunctionCalling.mock.calls[0][0];
    expect(systemPromptArg).toContain('Bạn là một AI assistant');
    expect(systemPromptArg).toContain('Phân tích ý định chính');

    // Check that the second arg contains user prompt with context
    const userPromptArg = openaiService.chatWithFunctionCalling.mock.calls[0][1];
    expect(userPromptArg).toContain('tạo task mới cho Nam');
    expect(userPromptArg).toContain('Phúc');
    expect(userPromptArg).toContain('XDEMO2');
  });

  it('should handle conversation history', async () => {
    // Thiết lập mock
    openaiService.chatWithFunctionCalling.mockResolvedValue('mock response');

    const userInput = 'update trạng thái';
    const context = {
      user: { name: 'Phúc' },
      project: { key: 'XDEMO2' },
      conversationHistory: [
        { role: 'user', content: 'tìm task của tôi' },
        { role: 'assistant', content: 'Đã tìm thấy 3 task: XDEMO2-5, XDEMO2-7, XDEMO2-8' }
      ],
    };

    await inputProcessor.processInput(userInput, context);

    // Check that conversation history is included in prompt
    const userPromptArg = openaiService.chatWithFunctionCalling.mock.calls[0][1];
    expect(userPromptArg).toContain('tìm task của tôi');
    expect(userPromptArg).toContain('XDEMO2-5');
  });
}); 