import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useSpaceBuilderStore } from '@/features/space-builder';

export default function SpaceBuilderIndex() {
  const status = useSpaceBuilderStore((s) => s.status);
  const config = useSpaceBuilderStore((s) => s.config);
  const hydrate = useSpaceBuilderStore((s) => s.hydrate);
  const persist = useSpaceBuilderStore((s) => s.persist);
  const isDirty = useSpaceBuilderStore((s) => s.isDirty);
  const seedDefault = useSpaceBuilderStore((s) => s.seedDefault);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View className="flex-1 justify-center px-6 gap-3">
      <Text className="text-base">Space Builder (foundation)</Text>
      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">config: {config ? 'loaded' : 'null'}</Text>

      <Pressable
        className="rounded-xl bg-black px-4 py-3"
        onPress={async () => {
          await persist();
        }}
        disabled={!isDirty || !config}
      >
        <Pressable
        className="rounded-xl bg-black px-4 py-3"
        onPress={() => {
            seedDefault();
        }}
        >
        <Text className="text-white text-center">Crear config default</Text>
        </Pressable>

        <Text className="text-white text-center">
          Guardar (disabled si no hay cambios)
        </Text>
      </Pressable>
    </View>
  );
}
