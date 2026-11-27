import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { useSessionStore } from '@/entities/session';
import { renderWithProviders } from '@/shared/lib/test';

import { AppHeader } from './app-header';

describe('AppHeader', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('직원 정보를 보여주고, 로그아웃하면 세션을 지운다', async () => {
    useSessionStore.getState().setSession({
      accessToken: 'token',
      username: 'crm_marketer',
      role: 'CRM_MARKETER',
      department: '고객관리팀',
      expiresAt: null,
    });
    renderWithProviders(<AppHeader />);

    expect(screen.getByText('crm_marketer')).toBeInTheDocument();
    expect(screen.getByText('고객관리팀 · CRM 마케터')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: '로그아웃' }));

    expect(useSessionStore.getState().session).toBeNull();
  });
});
