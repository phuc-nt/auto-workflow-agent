import { encoding_for_model, TiktokenModel } from 'tiktoken';

/**
 * Map các model mới về model tương thích với tiktoken
 * @param model Tên model
 * @returns Model tương thích với tiktoken
 */
function mapToSupportedModel(model: string): string {
  // Map các model mới về model tương thích
  const modelMap: Record<string, string> = {
    'gpt-4.1-mini': 'gpt-4',
    'gpt-4.1': 'gpt-4',
    'gpt-4.1-nano': 'gpt-4',
    'gpt-4o': 'gpt-4',
    'gpt-4o-mini': 'gpt-4',
    'o3': 'gpt-3.5-turbo',
    'o4-mini': 'gpt-4'
  };

  return modelMap[model] || model;
}

/**
 * Đếm số lượng token trong đoạn văn bản sử dụng tiktoken
 * @param text Đoạn văn bản cần đếm token
 * @param model Model để lấy encoder phù hợp
 * @returns Số lượng token
 */
export function countTokens(text: string, model: string = 'gpt-3.5-turbo'): number {
  try {
    // Map model sang model được hỗ trợ bởi tiktoken
    const mappedModel = mapToSupportedModel(model);
    
    // Sử dụng encoder phù hợp với model
    const encoder = encoding_for_model(mappedModel as TiktokenModel);
    // Encode text thành tokens
    const tokens = encoder.encode(text);
    // Return token count
    return tokens.length;
  } catch (error) {
    // Fallback heuristic: ~4 chars per token (xấp xỉ)
    console.error(`Error using tiktoken for model ${model}:`, error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Đếm token trong một tin nhắn chat
 * @param message Tin nhắn chat (bao gồm role và content)
 * @param model Model để lấy encoder phù hợp
 * @returns Số lượng token
 */
export function countMessageTokens(
  message: { role: string; content: string },
  model: string = 'gpt-3.5-turbo'
): number {
  // Số token cho format của message
  const tokenPerMessage = 4; // Cộng thêm cho format message
  
  // Đếm token của nội dung
  const contentTokens = countTokens(message.content, model);
  
  // Đếm token của role
  const roleTokens = countTokens(message.role, model);
  
  return tokenPerMessage + contentTokens + roleTokens;
}

/**
 * Đếm token trong một mảng các tin nhắn chat
 * @param messages Mảng các tin nhắn chat
 * @param model Model để lấy encoder phù hợp
 * @returns Số lượng token
 */
export function countChatTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo'
): number {
  // Token cho format của cuộc hội thoại
  const tokenPerRequest = 3; // Cộng thêm cho format request
  
  // Tính tổng token của các tin nhắn
  const messageTokens = messages.reduce(
    (total, message) => total + countMessageTokens(message, model),
    0
  );
  
  return tokenPerRequest + messageTokens;
} 