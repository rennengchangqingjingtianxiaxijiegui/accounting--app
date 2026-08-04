// 数据库种子数据 — 初始化 24 个默认收支分类
import { PrismaClient } from '@prisma/client';
import { ALL_DEFAULT_CATEGORIES } from '../../shared/constants/categories';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] 开始填充默认分类...');

  const categories = ALL_DEFAULT_CATEGORIES.map((cat) => ({
    name: cat.name,
    type: cat.type as 'INCOME' | 'EXPENSE',
    icon: cat.icon,
    sortOrder: cat.sortOrder,
    isDefault: true,
    bookId: null,
  }));

  // 先清空默认全局分类（幂等），再批量插入
  const deleted = await prisma.category.deleteMany({
    where: { isDefault: true, bookId: null },
  });
  console.log(`[Seed] 已清除 ${deleted.count} 条旧分类`);

  const result = await prisma.category.createMany({ data: categories });
  console.log(`[Seed] 完成! 共 ${result.count} 个默认分类`);

  // 打印分类汇总
  const incomeCount = categories.filter((c) => c.type === 'INCOME').length;
  const expenseCount = categories.filter((c) => c.type === 'EXPENSE').length;
  console.log(`[Seed] 收入分类: ${incomeCount} 个, 支出分类: ${expenseCount} 个`);
}

main()
  .catch((e) => {
    console.error('[Seed] 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
