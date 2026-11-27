import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/entities/session';
import { renderWithProviders, server } from '@/shared/lib/test';

import { LoginForm } from './login-form';

const API = 'http://localhost:8080';

async function submit(username: string, password: string) {
  const user = userEvent.setup();
  if (username) await user.type(screen.getByLabelText('아이디'), username);
  if (password) await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '로그인' }));
}

describe('LoginForm', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('로그인에 성공하면 세션을 저장하고 onSuccess 를 부른다', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/api/auth/login`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          accessToken: 'header.e30.sig',
          role: 'CRM_MARKETER',
          department: '고객관리팀',
        });
      }),
    );
    const onSuccess = vi.fn();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await submit('crm_marketer', 'secret');

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(body).toEqual({ username: 'crm_marketer', password: 'secret' });
    expect(useSessionStore.getState().session).toMatchObject({
      username: 'crm_marketer',
      role: 'CRM_MARKETER',
      department: '고객관리팀',
    });
  });

  it('실패하면 서버 메시지를 보여준다', async () => {
    server.use(
      http.post(`${API}/api/auth/login`, () =>
        HttpResponse.json(
          {
            status: 401,
            detail: '아이디 또는 비밀번호가 올바르지 않습니다.',
            code: 'INVALID_CREDENTIALS',
          },
          { status: 401 },
        ),
      ),
    );
    renderWithProviders(<LoginForm />);

    await submit('fds_admin', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '아이디 또는 비밀번호가 올바르지 않습니다.',
    );
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('빈 값이면 요청하지 않고 검증 메시지를 보여준다', async () => {
    renderWithProviders(<LoginForm />);

    await submit('', '');

    expect(await screen.findByText('아이디를 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument();
  });
});
