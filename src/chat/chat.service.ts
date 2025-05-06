import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { Readable } from 'stream';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Lấy API Key từ .env
    });
  }

  async streamChat(prompt: string): Promise<Readable> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Hoặc 'gpt-3.5-turbo'
      messages: [{ role: 'user', content: prompt }],
      stream: true, // Kích hoạt stream
    });

    const stream = new Readable({
      read() {}, // Bắt buộc để tránh lỗi stream
    });

    for await (const chunk of response) {
      stream.push(chunk.choices[0]?.delta?.content || '');
    }
    
    stream.push(null); // Kết thúc stream
    return stream;
  }
}
