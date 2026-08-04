// 账本状态管理
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { bookApi } from '@/api/book';
import type { Book, MemberRole } from '@/types/book';

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([]);
  const activeBookId = ref<number | null>(
    storage.get<number>(STORAGE_KEYS.ACTIVE_BOOK_ID)
  );
  const currentRole = ref<MemberRole | null>(null);

  const activeBook = computed(() =>
    books.value.find((b) => b.id === activeBookId.value) || null
  );

  async function fetchBooks() {
    const res = await bookApi.getList();
    books.value = res.data;
    // 如果没有选中账本，默认选第一个
    if (!activeBookId.value && books.value.length > 0) {
      activeBookId.value = books.value[0].id;
      storage.set(STORAGE_KEYS.ACTIVE_BOOK_ID, activeBookId.value);
    }
  }

  function switchBook(bookId: number) {
    activeBookId.value = bookId;
    storage.set(STORAGE_KEYS.ACTIVE_BOOK_ID, bookId);
  }

  return {
    books,
    activeBookId,
    currentRole,
    activeBook,
    fetchBooks,
    switchBook,
  };
});
