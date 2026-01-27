import { Tabs } from 'expo-router';

export default function AppTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="reservas" options={{ title: 'Reservas' }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventario' }} />
    </Tabs>
  );
}
