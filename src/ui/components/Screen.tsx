import { useSegments } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useEffect, useMemo } from 'react';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

import { useNavHistoryStore } from '../navigation/nav-history.store';

type ScreenProps = PropsWithChildren<
  SafeAreaViewProps & {
    className?: string;
  }
>;

export function Screen({ className, children, ...props }: ScreenProps) {
  const segments = useSegments();
  const push = useNavHistoryStore((s) => s.push);

  const href = useMemo(() => {
    if (!segments?.length) return null;
    return `/${segments.join('/')}`;
  }, [segments]);

  useEffect(() => {
    if (!href) return;
    push(href);
  }, [href, push]);

  return (
    <SafeAreaView
      className={['flex-1 bg-neutral-50', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
