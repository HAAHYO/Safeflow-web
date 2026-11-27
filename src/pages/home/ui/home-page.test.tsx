import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { useSessionStore } from '@/entities/session';
import { renderWithProviders, server } from '@/shared/lib/test';

import { HomePage } from './home-page';

describe('HomePage', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('로그인한 직원에게 인사말을 보여준다', () => {
    server.use(
      http.get('http://localhost:8080/api/transactions', () => HttpResponse.json({ items: [] })),
    );
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
