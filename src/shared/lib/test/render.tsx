import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

type Options = Omit<RenderOptions, 'wrapper'> & {
  /** 컴포넌트를 렌더할 경로. 기본값 '/' */
  route?: string;
};

/** QueryClient · Router 를 감싸서 렌더한다. 테스트마다 새 QueryClient 를 쓴다. */
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [route] });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
      options,
    ),
  };
}
