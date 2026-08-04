import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes/index';

export function createApp(): express.Application {
  const app = express();

  // 基础中间件
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 请求日志
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // API 路由
  app.use('/api/v1', apiRouter);

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 全局错误处理（最后注册）
  app.use(errorHandler);

  return app;
}
