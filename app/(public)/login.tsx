import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { Button, Card, Content, Screen } from '@/ui';

export default function LoginRoute() {
  const router = useRouter();
  const signInMock = useSessionStore((s) => s.signInMock);

  return (
    <Screen className="px-6">
      <Content className="flex-1 justify-center">
        <View className="items-center mb-6">
          <Text className="text-2xl font-semibold text-neutral-900">UrbanDesk</Text>
          <Text className="text-xs text-neutral-600 mt-1">Accede para continuar</Text>
        </View>

        <Card className="gap-3">
          <Text className="text-sm text-neutral-900">Login (dev mock)</Text>
          <Text className="text-xs text-neutral-600">Selecciona un rol para entrar.</Text>

          <Button
            variant="primary"
            size="lg"
            label="Entrar como usuario"
            onPress={async () => {
              await signInMock('user');
              router.replace('/(app)/reservas');
            }}
          />

          <Button
            variant="secondary"
            size="lg"
            label="Entrar como admin"
            onPress={async () => {
              await signInMock('admin');
              router.replace('/(admin)/space-builder');
            }}
          />
        </Card>

        <Text className="text-[10px] text-neutral-500 text-center mt-4">
          Versión dev • Web/Mobile
        </Text>
      </Content>
    </Screen>
  );
}
