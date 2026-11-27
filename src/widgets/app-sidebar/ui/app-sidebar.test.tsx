import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { type EmployeeRole, useSessionStore } from '@/entities/session';
import { renderWithProviders } from '@/shared/lib/test';

import { AppSidebar } from './app-sidebar';

function loginAs(role: EmployeeRole) {
  useSessionStore.getState().setSession({
    accessToken: 'token',
    username: 'crm_marketer',
    role,
    department: '고객관리팀',
    expiresAt: null,
  });
}

function menuLabels() {
  const nav = screen.getByRole('navigation', { name: '주 메뉴' });
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent);
}

describe('AppSidebar', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('직원 정보를 보여주고, 로그아웃하면 세션을 지운다', async () => {
    loginAs('CRM_MARKETER');
    renderWithProviders(<AppSidebar />);

    expect(screen.getByText('crm_marketer')).toBeInTheDocument();
    expect(screen.getByText('고객관리팀 · CRM 마케터')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: '로그아웃' }));

    expect(useSessionStore.getState().session).toBeNull();
  });

  it('역할에 맞는 메뉴만 보여준다', () => {
    loginAs('FDS_ADMIN');
    renderWithProviders(<AppSidebar />);

    expect(menuLabels()).toEqual(['대시보드', '거래 내역']);
  });

  it('CRM 마케터에게는 이탈 위험 고객 메뉴도 보여준다', () => {
    loginAs('CRM_MARKETER');
    renderWithProviders(<AppSidebar />);

    expect(menuLabels()).toEqual(['대시보드', '거래 내역', '이탈 위험 고객']);
  });
});
