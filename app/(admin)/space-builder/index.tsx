import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useSpaceBuilderStore } from '@/features/space-builder';
import type { WorkspaceConfig } from '@/features/spaces/domain/workspace.types';
import {
  AppHeader,
  Button,
  Card,
  Content,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Section,
} from '@/ui';

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
    const areas =
      config.areas.length > 0 ? config.areas : [{ id: areaId, name: 'Área 1' }];

    // Evita depender de strings específicos del union SpaceType:
    const fallbackType = (config.spaces[0]?.type ??
      ('desk' as unknown)) as WorkspaceConfig['spaces'][number]['type'];

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
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6">
        <Content className="gap-5">
          <AppHeader
            title="Space Builder"
            subtitle={`Admin • ${isDirty ? 'Cambios sin guardar' : 'Sin cambios'}`}
            onBack={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(app)/reservas');
            }}
            right={<Button size="sm" label="Recargar" onPress={() => void hydrate()} />}
          />

          {status === 'idle' || status === 'loading' ? (
            <LoadingState lines={4} />
          ) : status === 'error' ? (
            <ErrorState
              title="No se pudo cargar la configuración"
              onRetry={() => void hydrate()}
            />
          ) : !config ? (
            <EmptyState
              title="No hay configuración"
              description="Genera una configuración default y guárdala para habilitar Reservas."
              actionLabel="Seed default config"
              onAction={seedDefault}
            />
          ) : (
            <>
              <Card className="gap-2">
                <Text className="text-sm font-semibold text-neutral-900">Resumen</Text>
                <Text className="text-xs text-neutral-600">
                  version: {summary?.version}
                </Text>
                <Text className="text-xs text-neutral-600">areas: {summary?.areas}</Text>
                <Text className="text-xs text-neutral-600">
                  services: {summary?.services}
                </Text>
                <Text className="text-xs text-neutral-600">
                  spaces: {summary?.spaces}
                </Text>
              </Card>

              <Section
                title="Acciones"
                subtitle="Edita la config y guarda cambios"
                right={
                  <Button
                    size="sm"
                    variant="primary"
                    label="Guardar"
                    disabled={!isDirty}
                    onPress={() => void persist()}
                  />
                }
              >
                <View className="gap-2">
                  <Button label="+ Área" onPress={addArea} />
                  <Button label="+ Servicio" onPress={addService} />
                  <Button label="+ Espacio" onPress={addSpace} />
                </View>
              </Section>

              <Section title="Áreas" subtitle={`${config.areas.length}`}>
                <View className="gap-2">
                  {config.areas.map((a) => (
                    <Card key={a.id} className="px-4 py-3">
                      <Text className="text-sm text-neutral-900">{a.name}</Text>
                      <Text className="text-xs text-neutral-600 mt-0.5">{a.id}</Text>
                    </Card>
                  ))}
                </View>
              </Section>

              <Section title="Servicios" subtitle={`${config.services.length}`}>
                <View className="gap-2">
                  {config.services.map((s) => (
                    <Card key={s.id} className="px-4 py-3">
                      <Text className="text-sm text-neutral-900">{s.name}</Text>
                      <Text className="text-xs text-neutral-600 mt-0.5">{s.id}</Text>
                    </Card>
                  ))}
                </View>
              </Section>

              <Section title="Espacios" subtitle={`${config.spaces.length}`}>
                <View className="gap-2">
                  {config.spaces.map((sp) => (
                    <Card key={sp.id} className="px-4 py-3">
                      <Text className="text-sm text-neutral-900">{sp.name}</Text>
                      <Text className="text-xs text-neutral-600 mt-0.5">
                        {sp.type} • area: {sp.areaId} • services: {sp.serviceIds.length}
                      </Text>
                    </Card>
                  ))}
                </View>
              </Section>
            </>
          )}

          {!config && status === 'ready' ? (
            <Button
              variant="primary"
              size="lg"
              label="Guardar"
              onPress={() => void persist()}
            />
          ) : null}
        </Content>
      </ScrollView>
    </Screen>
  );
}
