import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSpaceBuilderStore } from '@/features/space-builder';
import type { WorkspaceConfig } from '@/features/spaces/domain/workspace.types';

function uid(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export default function SpaceBuilderAdminIndex() {
  const router = useRouter();

  const status = useSpaceBuilderStore((s) => s.status);
  const config = useSpaceBuilderStore((s) => s.config);
  const isDirty = useSpaceBuilderStore((s) => s.isDirty);

  const hydrate = useSpaceBuilderStore((s) => s.hydrate);
  const setConfig = useSpaceBuilderStore((s) => s.setConfig);
  const persist = useSpaceBuilderStore((s) => s.persist);
  const seedDefault = useSpaceBuilderStore((s) => s.seedDefault);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const summary = useMemo(() => {
    if (!config) return null;
    return {
      version: config.version,
      areas: config.areas.length,
      services: config.services.length,
      spaces: config.spaces.length,
    };
  }, [config]);

  const addArea = () => {
    if (!config) return;
    const next: WorkspaceConfig = {
      ...config,
      areas: [
        ...config.areas,
        { id: uid('area'), name: `Área ${config.areas.length + 1}` },
      ],
    };
    setConfig(next);
  };

  const addService = () => {
    if (!config) return;
    const next: WorkspaceConfig = {
      ...config,
      services: [
        ...config.services,
        { id: uid('svc'), name: `Servicio ${config.services.length + 1}` },
      ],
    };
    setConfig(next);
  };

  const addSpace = () => {
    if (!config) return;

    const areaId = config.areas[0]?.id ?? uid('area');
    const areas = config.areas.length > 0 ? config.areas : [{ id: areaId, name: 'Área 1' }];

    // Evita depender de strings específicos del union SpaceType:
    const fallbackType = (config.spaces[0]?.type ?? ('desk' as unknown)) as WorkspaceConfig['spaces'][number]['type'];

    const next: WorkspaceConfig = {
      ...config,
      areas,
      spaces: [
        ...config.spaces,
        {
          id: uid('sp'),
          name: `Espacio ${config.spaces.length + 1}`,
          type: fallbackType,
          areaId,
          serviceIds: [],
        },
      ],
    };

    setConfig(next);
  };

  return (
    <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base">Space Builder (Admin)</Text>
        <Pressable className="rounded-xl bg-neutral-200 px-4 py-2" onPress={() => router.back()}>
          <Text>Volver</Text>
        </Pressable>
      </View>

      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">config: {config ? 'present' : 'missing'}</Text>
      <Text className="text-sm">dirty: {isDirty ? 'yes' : 'no'}</Text>

      {!config ? (
        <View className="gap-2">
          <Text className="text-sm">No hay configuración. Genera una default y guárdala.</Text>

          <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={seedDefault}>
            <Text className="text-center">Seed default config</Text>
          </Pressable>

          <Pressable
            className={`rounded-xl px-4 py-3 ${status === 'ready' ? 'bg-black' : 'bg-neutral-300'}`}
            disabled={status !== 'ready'}
            onPress={() => void persist()}
          >
            <Text className="text-white text-center">Guardar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className="rounded-xl bg-neutral-100 px-4 py-3">
            <Text className="text-sm">Resumen</Text>
            <Text className="text-xs text-neutral-600">version: {summary?.version}</Text>
            <Text className="text-xs text-neutral-600">areas: {summary?.areas}</Text>
            <Text className="text-xs text-neutral-600">services: {summary?.services}</Text>
            <Text className="text-xs text-neutral-600">spaces: {summary?.spaces}</Text>
          </View>

          <View className="gap-2">
            <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={addArea}>
              <Text className="text-center">+ Área</Text>
            </Pressable>
            <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={addService}>
              <Text className="text-center">+ Servicio</Text>
            </Pressable>
            <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={addSpace}>
              <Text className="text-center">+ Espacio</Text>
            </Pressable>

            <Pressable
              className={`rounded-xl px-4 py-3 ${isDirty ? 'bg-black' : 'bg-neutral-300'}`}
              disabled={!isDirty}
              onPress={() => void persist()}
            >
              <Text className="text-white text-center">Guardar cambios</Text>
            </Pressable>

            <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={() => void hydrate()}>
              <Text className="text-center">Recargar desde storage</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-sm">Áreas</Text>
            {config.areas.map((a) => (
              <View key={a.id} className="rounded-xl bg-neutral-100 px-4 py-3">
                <Text className="text-sm">{a.name}</Text>
                <Text className="text-xs text-neutral-600">{a.id}</Text>
              </View>
            ))}
          </View>

          <View className="gap-2">
            <Text className="text-sm">Servicios</Text>
            {config.services.map((s) => (
              <View key={s.id} className="rounded-xl bg-neutral-100 px-4 py-3">
                <Text className="text-sm">{s.name}</Text>
                <Text className="text-xs text-neutral-600">{s.id}</Text>
              </View>
            ))}
          </View>

          <View className="gap-2">
            <Text className="text-sm">Espacios</Text>
            {config.spaces.map((sp) => (
              <View key={sp.id} className="rounded-xl bg-neutral-100 px-4 py-3">
                <Text className="text-sm">{sp.name}</Text>
                <Text className="text-xs text-neutral-600">
                  {sp.type} • area: {sp.areaId} • services: {sp.serviceIds.length}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
consider
    </ScrollView>
  );
}
