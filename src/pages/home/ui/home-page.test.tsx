import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useSessionStore } from '@/entities/session';
import { renderWithProviders } from '@/shared/lib/test';

import { HomePage } from './home-page';

describe('HomePage', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('로그인한 직원에게 환영 문구를 보여준다', () => {
    useSessionStore.getState().setSession({
      accessToken: 'token',
      username: 'fds_admin',
      role: 'FDS_ADMIN',
      department: '이상거래탐지팀',
      expiresAt: null,
    });
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByText(/이상거래탐지팀 fds_admin님/)).toBeInTheDocument();
  });
});
