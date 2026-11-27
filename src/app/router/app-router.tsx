import { createBrowserRouter, RouterProvider } from 'react-router';

import { CareActionsPage } from '@/pages/care-actions';
import { CrmPage } from '@/pages/crm';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { TransactionsPage } from '@/pages/transactions';

import { AppLayout } from './app-layout';
import { GuestOnly, RequireAuth, RequireRole } from './guards';

// 라우트 정의는 이 파일에만 둔다. 화면 자체는 pages 계층에 있다.
// 역할 제한은 백엔드 @PreAuthorize 와 맞추고, 사이드바 메뉴(widgets/app-sidebar)도 같이 고친다.
const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'care-actions', element: <CareActionsPage /> },
          {
            element: <RequireRole roles={['CRM_MARKETER']} />,
            children: [{ path: 'crm', element: <CrmPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
