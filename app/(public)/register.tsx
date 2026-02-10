import { Text } from 'react-native';

import { AppHeader, Card, Content, Screen } from '@/ui';

export default function RegisterRoute() {
  return (
    <Screen>
      <Content className="px-6 py-6 gap-4">
        <AppHeader title="Registro" subtitle="Próximamente" />
        <Card>
          <Text className="text-sm text-neutral-900">Register (placeholder)</Text>
          <Text className="text-xs text-neutral-600 mt-1">
            Esta pantalla se implementará en la siguiente iteración.
          </Text>
        </Card>
      </Content>
    </Screen>
  );
}
