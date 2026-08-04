// 账本组合式函数
import { ref, computed } from 'vue';
import { useBookStore } from '@/store/book';
import { bookApi } from '@/api/book';
import type {
  Book,
  BookMember,
  CreateBookParams,
  UpdateBookParams,
  AddMemberParams,
  UpdateMemberParams,
  MemberRole,
} from '@/types/book';
import { MemberRoleLabels } from '@/types/book';

export function useBook() {
  const store = useBookStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 从 store 获取状态
  const books = computed(() => store.books);
  const activeBook = computed(() => store.activeBook);
  const activeBookId = computed(() => store.activeBookId);
  const currentRole = computed(() => store.currentRole);

  /** 拉取账本列表 */
  async function fetchBooks(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await store.fetchBooks();
    } catch (e: any) {
      error.value = e?.message || '获取账本列表失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 切换当前账本 */
  function switchBook(bookId: number): void {
    store.switchBook(bookId);
  }

  /** 创建账本 */
  async function createBook(data: CreateBookParams): Promise<Book> {
    loading.value = true;
    try {
      const res = await bookApi.create(data);
      await store.fetchBooks(); // 刷新列表
      return res.data;
    } catch (e: any) {
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 更新账本 */
  async function updateBook(bookId: number, data: UpdateBookParams): Promise<Book> {
    const res = await bookApi.update(bookId, data);
    await store.fetchBooks();
    return res.data;
  }

  /** 删除账本 */
  async function deleteBook(bookId: number): Promise<void> {
    await bookApi.remove(bookId);
    await store.fetchBooks();
  }

  /** 获取成员列表 */
  async function getMembers(bookId: number): Promise<BookMember[]> {
    const res = await bookApi.getMembers(bookId);
    return res.data;
  }

  /** 添加成员 */
  async function addMember(bookId: number, data: AddMemberParams): Promise<BookMember> {
    const res = await bookApi.addMember(bookId, data);
    return res.data;
  }

  /** 更新成员角色 */
  async function updateMember(bookId: number, memberId: number, data: UpdateMemberParams): Promise<BookMember> {
    const res = await bookApi.updateMember(bookId, memberId, data);
    return res.data;
  }

  /** 移除成员 */
  async function removeMember(bookId: number, memberId: number): Promise<void> {
    await bookApi.removeMember(bookId, memberId);
  }

  /** 获取角色中文标签 */
  function getRoleLabel(role: MemberRole): string {
    return MemberRoleLabels[role] || role;
  }

  /** 检查是否有指定角色权限 */
  function hasRole(bookId: number, ...roles: MemberRole[]): boolean {
    const book = store.books.find((b) => b.id === bookId);
    if (!book || !book.myRole) return false;
    return roles.includes(book.myRole as MemberRole);
  }

  return {
    // 状态
    books,
    activeBook,
    activeBookId,
    currentRole,
    loading,
    error,

    // 方法
    fetchBooks,
    switchBook,
    createBook,
    updateBook,
    deleteBook,
    getMembers,
    addMember,
    updateMember,
    removeMember,
    getRoleLabel,
    hasRole,
  };
}
