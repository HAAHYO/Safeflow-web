import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isSessionExpired, type Session, sessionSchema } from './session';

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
      // 저장된 값은 형태가 바뀌었거나 조작됐을 수 있으므로 복원할 때 다시 검증한다.
      onRehydrateStorage: () => (state) => {
        if (!state?.session) return;
        const parsed = sessionSchema.safeParse(state.session);
        if (!parsed.success || isSessionExpired(parsed.data)) state.clearSession();
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
