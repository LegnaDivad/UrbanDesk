import type { PressableProps } from 'react-native';
import { Pressable, Text } from 'react-native';

type Props = PressableProps & {
  label: string;
  active?: boolean;
  className?: string;
};

export function Chip({ label, active = false, className, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      className={[
        'rounded-full px-3 py-2',
        active ? 'bg-black' : 'bg-neutral-200',
        props.disabled ? 'opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Text className={['text-xs', active ? 'text-white' : 'text-black'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
