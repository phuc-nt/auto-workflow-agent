import { Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { OpenAI } from 'openai';
import get from "lodash/get"; // Cài nếu chưa có: npm install lodash

interface BotAction {
  type: 'fetch_recent_messages' | 'send_message' | 'nothing' ;
  payload: any;
}

interface Task {

}

@Injectable()
export class SlackService {
  private slackClient: WebClient;
  private openai: OpenAI;

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async processUserRequest(userMessage: string) {
    const tasks = await this.analyzeRequestNew(userMessage); // AI xác định action cần làm
    console.log(tasks);
    
    let results: Record<string, any> = {};
  
    for (const task of tasks.tasks) {
      console.log(task.params);

      // Thay thế dữ liệu nếu task cần kết quả từ task trước
      for (let key in task.params) {
        
        if (typeof task.params[key] === "string" && task.params[key].includes("<result_of_")) {
          const refTask = task.params[key].match(/<result_of_(.*?)>/)?.[1];
          if (refTask && results[refTask]) {
            // 🔥 Nếu kết quả là danh sách tin nhắn, lấy tin đầu tiên
            if (Array.isArray(results[refTask]?.messages)) {
              task.params[key] = results[refTask].messages[0]?.text || "Không có nội dung";
            } else {
              task.params[key] = results[refTask];
            }
          }
        }
      }
      console.log("🔥 Nội dung tin nhắn được thay thế:", task.params.text);

      // Gọi Slack SDK với method và params mà AI quyết định
      console.log(task.params);
      
      results[task.task] = await this.executeSlackTask(task.method, task.params);
      console.log(results[task.task]);
      
    }
  
    return results;
  }

  async analyzeRequestNew(userMessage: string) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Bạn là một AI assistant giúp xử lý yêu cầu liên quan đến Slack bằng Bot Token." },
        { role: "system", content: "Luôn thay thế tham số bằng <result_of_task> nếu cần dữ liệu từ task trước. Ví dụ: gửi tin nhắn từ kết quả conversations.history thì text phải là <result_of_fetch_messages>." },
        { role: "user", content: userMessage }
      ],
      functions: [
        {
          name: "determine_slack_actions",
          description: "Xác định các hành động Slack cần thực hiện từ yêu cầu của người dùng, bao gồm cả tham số cần thiết.",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    task: { type: "string", description: "Tên nhiệm vụ (ví dụ: fetch_users, send_message)." },
                    method: { type: "string", description: "Method của Slack SDK để gọi (ví dụ: users.list, chat.postMessage)." },
                    params: {
                      type: "object",
                      description: "Tham số cần thiết cho method của Slack SDK, phải được lấy từ thông tin yêu cầu của người dùng.",
                      properties: {
                        channel: { type: "string", description: "ID của channel, nếu có trong yêu cầu." },
                        user: { type: "string", description: "ID của user, nếu có trong yêu cầu." },
                        text: { type: "string", description: "Nội dung tin nhắn, nếu có trong yêu cầu." },
                        limit: { type: "number", description: "Số lượng kết quả trả về, nếu có trong yêu cầu." }
                      },
                      additionalProperties: true
                    }
                  },
                  required: ["task", "method", "params"]
                }
              }
            },
            required: ["tasks"]
          }
        }
      ],      
      function_call: "auto"
    });

    const functionResponse = response.choices[0]?.message?.function_call;
    if (functionResponse?.name === "determine_slack_actions") {
      return JSON.parse(functionResponse.arguments);
    }
  
    throw new Error("AI không thể xác định được action.");
  }

  async executeSlackTask(method: string, params: any) {    
    const slackMethod = get(this.slackClient, method);

    if (typeof slackMethod !== "function") {
      throw new Error(`Unknown Slack method: ${method}`);
    }
  
    return await slackMethod(params);
  }
}
