/**
 * Định nghĩa interface cho context thực thi
 */
export interface ExecutionContext {
  result?: Record<string, any>;
  evaluation?: Record<string, any>;
  [key: string]: any;
} 