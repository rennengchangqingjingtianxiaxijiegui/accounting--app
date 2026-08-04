// 测试环境变量 — Jest setupFiles，在任何测试代码执行前加载

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://root:test@localhost:3306/accounting_test';
process.env.JWT_SECRET = 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars!!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.WECHAT_APPID = 'wx-test-appid';
process.env.WECHAT_SECRET = 'wx-test-secret';
process.env.PORT = '3001';
