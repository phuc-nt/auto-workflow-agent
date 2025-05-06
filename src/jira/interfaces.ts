export interface IssueType {
  name: string;
  // Các thuộc tính khác nếu có
}

export interface MetaResponseData {
  issueTypes: IssueType[];
}

export interface IssueData {
  issueTypeId: string;
  project: string;
  summary: string;
  reporterAccountId: string;
  description?: string;
  priorityName?: string;
  // Các thuộc tính khác nếu có
}

export interface RoleData {
  Administrator?: string;
  Member?: string;
  // Các thuộc tính khác nếu có
}

export interface UserData {
  displayName: string;
  actorUser: {
    accountId: string;
  };
}

export interface ChatMessage {
  role: string;
  content: string;
}
