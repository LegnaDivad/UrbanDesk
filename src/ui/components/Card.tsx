import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { Platform, View } from 'react-native';

type Props = PropsWithChildren<
  ViewProps & {
    className?: string;
    variant?: 'muted' | 'elevated';
  }
>;

export function Card({ className, variant = 'muted', children, ...props }: Props) {
  const base = 'rounded-2xl px-4 py-4 border border-neutral-200';
  const skin = variant === 'elevated' ? 'bg-white shadow-sm' : 'bg-white';
  const { style: styleProp, ...viewProps } = props;
  return (
    <View
      className={[base, skin, className].filter(Boolean).join(' ')}
      style={[
        Platform.OS === 'web'
          ? {
              boxShadow:
                variant === 'elevated'
                  ? '0 8px 24px rgba(0,0,0,0.08)'
                  : '0 2px 10px rgba(0,0,0,0.05)',
            }
          : null,
        styleProp,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
}
