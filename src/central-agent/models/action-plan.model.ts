export enum AgentType {
  JIRA = 'JIRA',
  SLACK = 'SLACK',
  EMAIL = 'EMAIL',
  CALENDAR = 'CALENDAR',
  MEETING_ROOM = 'MEETING_ROOM',
  CONFLUENCE = 'CONFLUENCE',
}

export enum StepStatus {
  PENDING = 'pending',     // Chưa bắt đầu
  WAITING = 'waiting',     // Đang chờ các step phụ thuộc
  RUNNING = 'running',     // Đang thực thi
  SUCCEEDED = 'succeeded', // Thành công
  FAILED = 'failed',       // Thất bại
  RETRYING = 'retrying',   // Đang thử lại
  SKIPPED = 'skipped',     // Bỏ qua (do điều kiện không thỏa)
  CANCELLED = 'cancelled'  // Đã hủy
}

export enum PlanStatus {
  CREATED = 'created',     // Mới tạo
  RUNNING = 'running',     // Đang thực thi
  COMPLETED = 'completed', // Hoàn thành thành công
  FAILED = 'failed',       // Thất bại
  CANCELLED = 'cancelled', // Đã hủy
  PENDING = 'pending'      // Đang chờ xử lý
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: any;
  metadata?: {
    executionTime?: number;
    tokenUsage?: number;
  };
}

export interface StepEvaluation {
  success: boolean;
  reason: string;
  needsAdjustment: boolean;
}

export interface ActionStep {
  id: string;
  agentType: AgentType;
  prompt: string;
  dependsOn: string[];
  condition?: string;
  maxRetries?: number;
  retryCount?: number;
  timeout?: number;
  status: StepStatus;
  result?: StepResult;
  evaluation?: StepEvaluation;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  description?: string;
  action?: string;
  parameters?: any;
}

export interface ActionPlan {
  id?: string;
  parentPlanId?: string;
  steps: ActionStep[];
  currentStepIndex: number;
  executionContext: Record<string, any>;
  status: PlanStatus;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  overallProgress: number;
  description?: string;
  goal?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isAdjustment?: boolean;
  metadata?: any;
} 