import { createApp } from './app';
import { config } from './config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const app = createApp();

  // 连接数据库
  await prisma.$connect();
  console.log('[DB] 数据库连接成功');

  const server = app.listen(config.PORT, () => {
    console.log(`[Server] 运行在 http://localhost:${config.PORT}`);
    console.log(`[Server] 环境: ${config.NODE_ENV}`);
  });

  // 优雅关闭
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] 收到 ${signal}，正在关闭...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[DB] 数据库连接已关闭');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('[Server] 启动失败:', error);
  process.exit(1);
});
