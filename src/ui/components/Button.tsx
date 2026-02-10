import type { PropsWithChildren, ReactNode } from 'react';
import type { PressableProps } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = PropsWithChildren<
  Omit<PressableProps, 'children'> & {
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    textClassName?: string;
    left?: ReactNode;
    right?: ReactNode;
  }
>;

function variantClasses(
  variant: ButtonVariant,
  disabled: boolean | undefined,
): { root: string; text: string } {
  if (disabled) return { root: 'bg-neutral-100', text: 'text-neutral-400' };

  switch (variant) {
    case 'primary':
      return { root: 'bg-black', text: 'text-white' };
    case 'danger':
      return { root: 'bg-neutral-800', text: 'text-white' };
    case 'ghost':
      return { root: 'bg-transparent', text: 'text-black' };
    case 'secondary':
    default:
      return { root: 'bg-neutral-200', text: 'text-black' };
  }
}

function sizeClasses(size: ButtonSize): { root: string; text: string } {
  switch (size) {
    case 'sm':
      return { root: 'px-3 py-2 rounded-xl', text: 'text-xs' };
    case 'lg':
      return { root: 'px-5 py-4 rounded-2xl', text: 'text-base' };
    case 'md':
    default:
      return { root: 'px-4 py-3 rounded-xl', text: 'text-sm' };
  }
}

export function Button({
  label,
  children,
  variant = 'secondary',
  size = 'md',
  disabled,
  className,
  textClassName,
  left,
  right,
  ...props
}: Props) {
  const v = variantClasses(variant, disabled ?? undefined);
  const s = sizeClasses(size);
  const { style: styleProp, ...pressableProps } = props;

  const content = label ? (
    <Text
      className={[s.text, v.text, 'text-center', textClassName].filter(Boolean).join(' ')}
    >
      {label}
    </Text>
  ) : (
    <Text className={[s.text, v.text, textClassName].filter(Boolean).join(' ')}>
      {children}
    </Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      className={['flex-row items-center justify-center gap-2', s.root, v.root, className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      style={(state) => {
        const fromProps = typeof styleProp === 'function' ? styleProp(state) : styleProp;
        const flat = StyleSheet.flatten(fromProps) as ViewStyle | undefined;

        const web: ViewStyle | null =
          Platform.OS === 'web'
            ? (() => {
                const cursor: ViewStyle['cursor'] = disabled ? 'auto' : 'pointer';
                return { cursor } as ViewStyle;
              })()
            : null;

        const pressed: ViewStyle | null = state.pressed
          ? { opacity: 0.9, transform: [{ scale: 0.99 }] }
          : null;

        // hovered/focused solo existen en web; si no, quedan como undefined.
        const hovered: ViewStyle | null = (state as any).hovered
          ? { opacity: 0.97 }
          : null;
        const focused: ViewStyle | null = (state as any).focused ? { opacity: 1 } : null;

        return [flat, web, hovered, focused, pressed];
      }}
      {...pressableProps}
    >
      {left ? <View>{left}</View> : null}
      {content}
      {right ? <View>{right}</View> : null}
    </Pressable>
  );
}
