import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { renderWithProviders, server } from '@/shared/lib/test';

import { TransactionsPage } from './transactions-page';

const API = 'http://localhost:8080';

describe('TransactionsPage 시뮬레이션 패널', () => {
  beforeEach(() => {
    server.use(http.get(`${API}/api/transactions`, () => HttpResponse.json({ items: [] })));
  });

  it('처음에는 닫혀 있고, aria-controls 는 항상 있는 영역을 가리킨다', () => {
    renderWithProviders(<TransactionsPage />);

    const toggle = screen.getByRole('button', { name: '거래 시뮬레이션' });
    const panelId = toggle.getAttribute('aria-controls');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panelId && document.getElementById(panelId)).not.toBeVisible();
  });

  it('닫았다 다시 열어도 입력하던 값이 남는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsPage />);

    await user.click(screen.getByRole('button', { name: '거래 시뮬레이션' }));
    await user.type(screen.getByLabelText('금액(원)'), '50000');
    await user.click(screen.getByRole('button', { name: '시뮬레이션 닫기' }));

    expect(screen.getByLabelText('금액(원)')).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: '거래 시뮬레이션' }));

    expect(screen.getByLabelText('금액(원)')).toHaveValue('50000');
  });
});
