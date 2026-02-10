import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Button } from './Button';

type Props = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onBack?: (() => void) | null;
  backLabel?: string;
};

export function AppHeader({
  title,
  subtitle,
  left,
  right,
  onBack = null,
  backLabel = 'Volver',
}: Props) {
  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1">
          {onBack ? (
            <Button
              size="sm"
              variant="ghost"
              label={backLabel}
              onPress={onBack}
              className="px-0"
            />
          ) : null}
          {left ? <View>{left}</View> : null}

          <View className="flex-1">
            <Text className="text-lg font-semibold text-neutral-900">{title}</Text>
            {subtitle ? (
              <Text className="text-xs text-neutral-600 mt-0.5">{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
      </View>
    </View>
  );
}
