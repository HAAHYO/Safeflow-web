import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isSessionExpired, type Session } from './session';

type SessionState = {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
};

// 탭을 닫으면 로그아웃되도록 sessionStorage 에 둔다.
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'safeflow-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ session }) => ({ session }),
      onRehydrateStorage: () => (state) => {
        if (state?.session && isSessionExpired(state.session)) state.clearSession();
      },
    },
  ),
);

export function useSession() {
  return useSessionStore((state) => state.session);
}

/** API 요청에 실을 토큰. 만료됐으면 세션을 지우고 null. */
export function getAccessToken(): string | null {
  const { session, clearSession } = useSessionStore.getState();
  if (!session) return null;
  if (isSessionExpired(session)) {
    clearSession();
    return null;
  }
  return session.accessToken;
}
