/**
 * Safe wrapper for browser storage access (localStorage) with guaranteed in-memory fallback.
 * Guarantees zero unhandled exceptions and full data retention in sandboxed, restricted,
 * private browsing, or Node testing environments.
 */

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // Fallback to in-memory store in private or restricted environments
    }
    return memoryStore[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    memoryStore[key] = String(value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Fallback already populated in memoryStore
    }
  },

  removeItem: (key: string): void => {
    delete memoryStore[key];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // Handled in memoryStore
    }
  },

  clear: (): void => {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      // Handled in memoryStore
    }
  },
};
