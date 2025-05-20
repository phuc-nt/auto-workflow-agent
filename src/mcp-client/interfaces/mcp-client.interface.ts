export interface IMCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  readResource(uri: string): Promise<any>;
  callTool(name: string, parameters: Record<string, any>): Promise<any>;
  isConnected(): boolean;
}

export interface MCPClientConfig {
  name: string;
  version: string;
  serverPath: string;
  env?: Record<string, string>;
}

export class MCPClientError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'MCPClientError';
  }
}
