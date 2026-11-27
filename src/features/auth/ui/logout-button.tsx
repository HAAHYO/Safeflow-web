import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';

import { useLogout } from '../model/use-logout';

export function LogoutButton() {
  const logout = useLogout();

  return (
    <Button variant="ghost" size="sm" onClick={logout} aria-label="로그아웃" title="로그아웃">
      <Icon name="logout" />
    </Button>
  );
}
