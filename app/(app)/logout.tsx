import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { useSessionStore } from '@/features/auth';

export default function LogoutRoute() {
  const signOut = useSessionStore((s) => s.signOut);

  useEffect(() => {
    void signOut();
  }, [signOut]);

  return <Redirect href="/login" />;
}
