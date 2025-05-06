/**
 * Cấu hình chi phí cho các model OpenAI
 */

export interface ModelCostConfig {
  model: string;
  promptTokenCost: number;  // USD per 1K tokens
  completionTokenCost: number;  // USD per 1K tokens
}

/**
 * Bảng chi phí các model theo giá của OpenAI (USD/1K tokens)
 * https://openai.com/pricing
 */
export const MODEL_COST_CONFIG: Record<string, ModelCostConfig> = {
  'gpt-4o': {
    model: 'gpt-4o',
    promptTokenCost: 0.0025,    // $0.0025 per 1K tokens
    completionTokenCost: 0.01    // $0.01 per 1K tokens
  },
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    promptTokenCost: 0.00015,    // $0.00015 per 1K tokens
    completionTokenCost: 0.0006  // $0.0006 per 1K tokens
  },
  'gpt-4.1': {
    model: 'gpt-4.1',
    promptTokenCost: 0.002,      // $0.002 per 1K tokens
    completionTokenCost: 0.008   // $0.008 per 1K tokens
  },
  'gpt-4.1-mini': {
    model: 'gpt-4.1-mini',
    promptTokenCost: 0.0004,     // $0.0004 per 1K tokens
    completionTokenCost: 0.0016  // $0.0016 per 1K tokens
  },
  'gpt-4.1-nano': {
    model: 'gpt-4.1-nano',
    promptTokenCost: 0.0001,     // $0.0001 per 1K tokens
    completionTokenCost: 0.0004  // $0.0004 per 1K tokens
  },
  'o3': {
    model: 'o3',
    promptTokenCost: 0.01,       // $0.01 per 1K tokens
    completionTokenCost: 0.04    // $0.04 per 1K tokens
  },
  'o4-mini': {
    model: 'o4-mini',
    promptTokenCost: 0.0011,     // $0.0011 per 1K tokens
    completionTokenCost: 0.0044  // $0.0044 per 1K tokens
  },
  'gpt-4-turbo': {
    model: 'gpt-4-turbo',
    promptTokenCost: 0.01,
    completionTokenCost: 0.03
  },
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    promptTokenCost: 0.0005,
    completionTokenCost: 0.0015
  }
};

/**
 * Lấy cấu hình chi phí cho model
 * @param model Tên model
 * @returns Cấu hình chi phí
 */
export function getModelCostConfig(model: string): ModelCostConfig {
  // Tìm chính xác model
  if (MODEL_COST_CONFIG[model]) {
    return MODEL_COST_CONFIG[model];
  }
  
  // Tìm model có prefix tương tự
  for (const key of Object.keys(MODEL_COST_CONFIG)) {
    if (model.startsWith(key)) {
      return MODEL_COST_CONFIG[key];
    }
  }
  
  // Mặc định dùng cấu hình gpt-3.5-turbo
  return MODEL_COST_CONFIG['gpt-3.5-turbo'];
}

/**
 * Tính chi phí sử dụng token
 * @param model Tên model
 * @param promptTokens Số token prompt
 * @param completionTokens Số token completion
 * @returns Chi phí tính theo USD
 */
export function calculateCost(
  model: string, 
  promptTokens: number, 
  completionTokens: number
): number {
  const costConfig = getModelCostConfig(model);
  
  const promptCost = (promptTokens / 1000) * costConfig.promptTokenCost;
  const completionCost = (completionTokens / 1000) * costConfig.completionTokenCost;
  
  return promptCost + completionCost;
} 