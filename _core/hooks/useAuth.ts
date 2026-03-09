// Auth is disabled — this hook is kept for compatibility but returns a no-op state.
export function useAuth() {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: () => {},
    logout: async () => {},
  };
}
