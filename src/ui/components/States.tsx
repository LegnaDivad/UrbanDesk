import { Text, View } from 'react-native';

import { Button } from './Button';
import { Card } from './Card';

type EmptyProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyProps) {
  return (
    <Card className="gap-2">
      <Text className="text-sm text-neutral-900">{title}</Text>
      {description ? (
        <Text className="text-xs text-neutral-600">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          size="sm"
          variant="secondary"
          label={actionLabel}
          onPress={onAction}
          className="self-start"
        />
      ) : null}
    </Card>
  );
}

type ErrorProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Ocurrió un problema',
  description = 'No se pudo cargar la información.',
  retryLabel = 'Reintentar',
  onRetry,
}: ErrorProps) {
  return (
    <Card className="gap-2">
      <Text className="text-sm text-neutral-900">{title}</Text>
      <Text className="text-xs text-neutral-600">{description}</Text>
      {onRetry ? (
        <Button size="sm" label={retryLabel} onPress={onRetry} className="self-start" />
      ) : null}
    </Card>
  );
}

type LoadingProps = {
  lines?: number;
};

export function LoadingState({ lines = 3 }: LoadingProps) {
  return (
    <View className="gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} className="h-16 rounded-2xl bg-neutral-100" />
      ))}
    </View>
  );
}
