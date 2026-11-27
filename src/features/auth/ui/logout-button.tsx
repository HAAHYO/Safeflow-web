import { Button } from '@/shared/ui/button';

import { useLogout } from '../model/use-logout';

export function LogoutButton() {
  const logout = useLogout();

  return (
    <Button variant="secondary" onClick={logout}>
      로그아웃
    </Button>
  );
}
