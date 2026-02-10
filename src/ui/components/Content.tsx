import type { PropsWithChildren } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

type Props = PropsWithChildren<
  ViewProps & {
    className?: string;
    maxWidth?: number;
  }
>;

export function Content({ className, children, maxWidth = 980, style, ...props }: Props) {
  const webStyle =
    Platform.OS === 'web'
      ? [{ width: '100%', maxWidth, alignSelf: 'center' } as const, style]
      : style;

  return (
    <View
      className={['w-full', className].filter(Boolean).join(' ')}
      style={webStyle}
      {...props}
    >
      {children}
    </View>
  );
}
