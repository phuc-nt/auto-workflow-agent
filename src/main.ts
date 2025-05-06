import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Cấu hình logger với màu sắc
const logger = new Logger('Application');

// Đảm bảo thư mục logs tồn tại
function setupLogDirectory() {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  return logsDir;
}

// Tạo stream ghi logs ra file và console
function createLogStreams() {
  const logsDir = setupLogDirectory();
  const date = new Date().toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
  const logFile = path.join(logsDir, `app-${date}.log`);
  
  // Tạo file stream
  const fileStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  return {
    fileStream,
    logToFileAndConsole: (message: string) => {
      // Ghi ra file
      fileStream.write(`${new Date().toISOString()} - ${message}\n`);
      // Hiển thị ra console
      console.log(message);
    }
  };
}

async function bootstrap() {
  const { fileStream, logToFileAndConsole } = createLogStreams();
  
  // Log khởi động ứng dụng
  logToFileAndConsole('Khởi động ứng dụng...');
  
  // Thiết lập mức log chi tiết cho toàn ứng dụng
  // Log tất cả mọi level từ error đến debug
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    // Buộc logger hiển thị thông tin đầy đủ
    bufferLogs: false,
  });
  
  app.enableCors(); // Enable CORS for all routes
  
  // Serve swagger documentation at /api
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevAssist API')
    .setDescription('DevAssist Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  // Lấy cổng từ biến môi trường hoặc sử dụng 3001 
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  const serverUrl = `http://localhost:${port}`;
  logToFileAndConsole(`Application is running on: ${serverUrl}`);
  
  // Xử lý khi ứng dụng kết thúc
  process.on('SIGINT', () => {
    logToFileAndConsole('Ứng dụng đang tắt...');
    fileStream.end();
    process.exit(0);
  });
}

bootstrap();
