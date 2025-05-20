# MCP Integration Architecture

## Overview

The Model Context Protocol (MCP) integration in Auto Workflow Agent enables the system to interact with Jira and Confluence using LLM-driven prompt analysis. This document outlines the architecture and components involved in this integration.

## Key Components

### 1. MCPInventoryService

**Purpose**: Manages the inventory of resources and tools available from MCP servers.

**Key features**:
- Caches resources and tools for improved performance
- Categorizes resources and tools by agent type (JIRA, CONFLUENCE)
- Handles cases where meta information is unavailable through fallback mechanisms

**Location**: `/src/mcp-client/mcp-inventory.service.ts`

### 2. PromptAnalyzerService

**Purpose**: Analyzes user prompts using LLM to determine the appropriate action, resource/tool, and parameters.

**Key features**:
- Uses OpenAI for natural language understanding
- Provides system prompts with available resources and tools
- Returns structured analysis results with confidence scores

**Location**: `/src/central-agent/prompt-analyzer/prompt-analyzer.service.ts`

### 3. Agent Implementation

The MCP integration is implemented in two agent types:

#### MCPJiraAgent
- Handles Jira-related requests
- Uses PromptAnalyzerService for prompt interpretation
- Falls back to regex-based parsing when LLM confidence is low

**Location**: `/src/central-agent/agents/mcp-jira-agent.ts`

#### MCPConfluenceAgent
- Handles Confluence-related requests
- Uses PromptAnalyzerService for prompt interpretation
- Falls back to regex-based parsing when LLM confidence is low

**Location**: `/src/central-agent/agents/mcp-confluence-agent.ts`

## Flow Diagram

```
User prompt → PromptAnalyzerService → MCPInventoryService → MCP Client → External API
                       ↓
                Analysis Result
                       ↓
                Agent (Jira/Confluence)
                       ↓
                  Response to user
```

## Implementation Details

### 1. Prompt Analysis

The system analyzes prompts to determine:
- Whether to read a resource or call a tool
- Which specific resource or tool to use
- What parameters are needed

Example analysis result:
```json
{
  "action": "readResource",
  "resourceOrTool": "jira://issues",
  "parameters": { "jql": "project = XYZ" },
  "confidence": 0.95,
  "originalPrompt": "Get all issues from project XYZ"
}
```

### 2. Fallback Mechanism

When the LLM analysis has low confidence (< 0.7), the system falls back to the traditional regex-based parsing to ensure reliability.

### 3. Error Handling

The system includes comprehensive error handling:
- Validation of LLM responses
- Error capturing during API calls
- Proper error messages for users

## Testing

The integration includes:
- Unit tests for PromptAnalyzerService
- Unit tests for MCPInventoryService
- Integration tests for agents

## Future Enhancements

Potential areas for improvement:
- Fine-tuning the LLM for better prompt analysis
- Expanding support for more MCP resources and tools
- Improving caching mechanisms for better performance
- Adding logging for tracking system interactions
