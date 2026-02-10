import type { PropsWithChildren, ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  right?: ReactNode;
}>;

export function Section({ title, subtitle, right, children }: Props) {
  return (
    <View className="gap-2">
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-neutral-900">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-neutral-600 mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
      </View>
      {children}
    </View>
  );
}
