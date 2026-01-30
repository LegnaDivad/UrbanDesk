import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { Screen } from '@/ui';

export default function LoginRoute() {
  const router = useRouter();
  const signInMock = useSessionStore((s) => s.signInMock);

  return (
    <Screen className="items-center justify-center gap-3 px-6">
      <Text className="text-base">Login (dev mock)</Text>

      <Pressable
        className="w-full rounded-xl bg-black px-4 py-3"
        onPress={async () => {
          await signInMock('user');
          router.replace('/(app)/reservas');
        }}
      >
        <Text className="text-white text-center">Entrar como usuario</Text>
      </Pressable>

      <Pressable
        className="w-full rounded-xl bg-black px-4 py-3"
        onPress={async () => {
          await signInMock('admin');
          router.replace('/(admin)/space-builder');
        }}
      >
        <Text className="text-white text-center">Entrar como admin</Text>
      </Pressable>
    </Screen>
  );
}
