export interface MCPConfig {
  useMCPAgents: boolean;
  serverPath: string;
  serverTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const mcpConfig = (): MCPConfig => ({
  useMCPAgents: process.env.USE_MCP_AGENTS === 'true',
  serverPath: process.env.MCP_SERVER_PATH || '',
  serverTimeout: parseInt(process.env.MCP_SERVER_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.MCP_RETRY_DELAY || '1000', 10),
});

export default mcpConfig;
