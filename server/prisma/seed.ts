// 数据库种子数据 — 初始化 24 个默认收支分类（显式 ID，与前端常量对齐）
import { PrismaClient } from '@prisma/client';
import { ALL_DEFAULT_CATEGORIES } from '../../shared/constants/categories';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] 开始填充默认分类...');

  // 使用 raw SQL 插入显式 ID，确保与 shared/constants 中的 ID 一致
  // 先清空旧的默认全局分类并重置自增计数器
  await prisma.$executeRawUnsafe(`DELETE FROM categories WHERE is_default = true AND book_id IS NULL`);
  await prisma.$executeRawUnsafe(`ALTER TABLE categories AUTO_INCREMENT = 1`);

  for (const cat of ALL_DEFAULT_CATEGORIES) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO categories (id, name, type, icon, sort_order, is_default, book_id) VALUES (?, ?, ?, ?, ?, true, NULL)`,
      cat.id,
      cat.name,
      cat.type,
      cat.icon,
      cat.sortOrder,
    );
  }

  console.log(`[Seed] 完成! 共 ${ALL_DEFAULT_CATEGORIES.length} 个默认分类`);

  const incomeCount = ALL_DEFAULT_CATEGORIES.filter((c) => c.type === 'INCOME').length;
  const expenseCount = ALL_DEFAULT_CATEGORIES.filter((c) => c.type === 'EXPENSE').length;
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
