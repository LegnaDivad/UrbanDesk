import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppTabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="reservas" options={{ title: 'Reservas' }} />
        <Tabs.Screen name="inventory" options={{ title: 'Inventario' }} />
      </Tabs>
    </SafeAreaView>
  );
}
