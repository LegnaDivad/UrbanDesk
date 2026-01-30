import type { PropsWithChildren } from 'react';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<
  SafeAreaViewProps & {
    className?: string;
  }
>;

export function Screen({ className, children, ...props }: ScreenProps) {
  return (
    <SafeAreaView className={['flex-1', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </SafeAreaView>
  );
}
