import { createBrowserRouter, RouterProvider } from 'react-router';

import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';

import { RootLayout } from './root-layout';

// 라우트 정의는 이 파일에만 둔다. 화면 자체는 pages 계층에 있다.
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
