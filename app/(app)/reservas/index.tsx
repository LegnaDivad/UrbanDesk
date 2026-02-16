import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useReservasStore } from '@/features/reservas';
import { canBook } from '@/features/reservas/domain/bookingPolicy';
import { addMinutes } from '@/features/reservas/domain/bookingWindow';
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

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatLocalYYYYMMDDHHMM(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseLocalYYYYMMDDHHMM(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Acepta "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm"
  const normalized = trimmed.replace('T', ' ');
  const m = normalized.match(
    /^([0-9]{4})-([0-9]{2})-([0-9]{2})\s+([0-9]{1,2}):([0-9]{2})$/,
  );
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  const d = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

export default function ReservasIndex() {
  const router = useRouter();
  const [showHorarioMenu, setShowHorarioMenu] = useState(false);
  const [creationISO, setCreationISO] = useState<string | null>(null);

  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  const [draftStartISO, setDraftStartISO] = useState<string | null>(null);
  const [draftEndISO, setDraftEndISO] = useState<string | null>(null);
  const params = useLocalSearchParams<{
    spaceId?: string | string[];
    bookingId?: string | string[];
  }>();

  const deepLinkSpaceId = firstParam(params.spaceId) ?? null;
  const deepLinkBookingId = firstParam(params.bookingId) ?? null;

  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';
  const role = useSessionStore((s) => s.session?.role ?? null);

  const status = useReservasStore((s) => s.status);
  const config = useReservasStore((s) => s.config);
  const spaces = useReservasStore((s) => s.spaces);
  const bookings = useReservasStore((s) => s.bookings);
  const selectedSpaceId = useReservasStore((s) => s.selectedSpaceId);

  const hydrate = useReservasStore((s) => s.hydrate);
  const selectSpace = useReservasStore((s) => s.selectSpace);
  const createMockBooking = useReservasStore((s) => s.createMockBooking);

  const bookingStartISO = useReservasStore((s) => s.bookingStartISO);
  const durationMinutes = useReservasStore((s) => s.durationMinutes);

  const cancelBooking = useReservasStore((s) => s.cancelBooking);
  const isSpaceOccupied = useReservasStore((s) => s.isSpaceOccupied);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Deep-link: al estar ready y existir spaceId, selecciona el espacio
  useEffect(() => {
    if (status !== 'ready') return;
    if (!deepLinkSpaceId) return;

    const exists = spaces.some((s) => s.id === deepLinkSpaceId);
    if (!exists) return;

    selectSpace(deepLinkSpaceId);
  }, [deepLinkSpaceId, selectSpace, spaces, status]);

  const selectedBookingsCount = useMemo(() => {
    if (!selectedSpaceId) return 0;
    return bookings.filter((b) => b.spaceId === selectedSpaceId).length;
  }, [bookings, selectedSpaceId]);

  const myBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.userId === userId).length;
  }, [bookings, userId]);

  const myBookings = useMemo(() => {
    return bookings.filter((b) => b.userId === userId).slice(0, 5);
  }, [bookings, userId]);

  const areasById = useMemo(() => {
    return new Map(config?.areas.map((a) => [a.id, a.name]) ?? []);
  }, [config?.areas]);

  const grouped = useMemo(() => {
    return spaces.reduce<Record<string, typeof spaces>>((acc, s) => {
      const areaName = areasById.get(s.areaId) ?? 'Sin área';
      const key = `${areaName} / ${s.type}`;
      acc[key] = acc[key] ? [...acc[key], s] : [s];
      return acc;
    }, {});
  }, [areasById, spaces]);

  const openedFromNotification = Boolean(deepLinkSpaceId || deepLinkBookingId);

  const closeHorarioMenu = () => setShowHorarioMenu(false);

  const openHorarioMenu = () => {
    if (!selectedSpaceId) return;

    const initialStartISO = bookingStartISO;
    const initialEndISO = addMinutes(initialStartISO, durationMinutes);

    setDraftStartISO(initialStartISO);
    setDraftEndISO(initialEndISO);
    setStartText(formatLocalYYYYMMDDHHMM(initialStartISO));
    setEndText(formatLocalYYYYMMDDHHMM(initialEndISO));
    setStartError(null);
    setEndError(null);
    setCreationISO(new Date().toISOString());
    setShowHorarioMenu(true);
  };

  useEffect(() => {
    if (!showHorarioMenu) return;

    // Mientras el modal esté abierto, la "hora de creación" representa "ahora"
    // y se refresca cada minuto.
    const id = setInterval(() => {
      setCreationISO(new Date().toISOString());
    }, 60 * 1000);

    return () => clearInterval(id);
  }, [showHorarioMenu]);

  const availability = useMemo(() => {
    if (!selectedSpaceId) return { canConfirm: false, label: 'Selecciona un espacio' };
    if (!draftStartISO || !draftEndISO)
      return { canConfirm: false, label: 'Horario inválido' };

    const active = bookings.filter((b) => b.status === 'active');
    const capacity = spaces.find((s) => s.id === selectedSpaceId)?.capacity ?? 1;
    const ok = canBook(selectedSpaceId, draftStartISO, draftEndISO, active, capacity);
    return ok
      ? { canConfirm: true, label: 'Disponible' }
      : { canConfirm: false, label: 'Ocupado en ese horario' };
  }, [bookings, draftEndISO, draftStartISO, selectedSpaceId, spaces]);

  const timePolicy = useMemo(() => {
    if (!creationISO) return { ok: true, message: null as string | null };

    const createdMs = new Date(creationISO).getTime();
    const startMs = draftStartISO ? new Date(draftStartISO).getTime() : NaN;
    const endMs = draftEndISO ? new Date(draftEndISO).getTime() : NaN;
    if (!Number.isFinite(createdMs)) {
      return { ok: false, message: 'Hora inválida.' };
    }

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { ok: false, message: 'Hora inválida.' };
    }

    if (startMs < createdMs) {
      return {
        ok: false,
        message: 'La hora de inicio no puede ser menor que la hora de creación.',
      };
    }

    const maxCreatedMs = createdMs + 8 * 60 * 60 * 1000;
    if (startMs > maxCreatedMs) {
      return {
        ok: false,
        message: 'La hora de inicio no puede ser mayor a 8 horas desde la creación.',
      };
    }

    if (endMs < startMs) {
      return { ok: false, message: 'La hora fin no puede ser menor que la hora inicio.' };
    }

    const maxEndMs = startMs + 8 * 60 * 60 * 1000;
    if (endMs > maxEndMs) {
      return { ok: false, message: 'La reserva no puede durar más de 8 horas.' };
    }

    if (endMs > maxCreatedMs) {
      return {
        ok: false,
        message: 'La hora fin no puede ser mayor a 8 horas desde la creación.',
      };
    }

    return { ok: true, message: null };
  }, [creationISO, draftEndISO, draftStartISO]);

  const canConfirm = availability.canConfirm && timePolicy.ok && !startError && !endError;

  return (
    <Screen>
      <Modal
        visible={showHorarioMenu}
        transparent
        animationType="fade"
        onRequestClose={closeHorarioMenu}
      >
        <Pressable className="flex-1 bg-black/40 px-6 py-6" onPress={closeHorarioMenu}>
          <Pressable
            className="mt-auto"
            onPress={() => {
              // evita cerrar al tocar dentro del contenido
            }}
          >
            <Card className="gap-3">
              <View className="gap-1">
                <Text className="text-sm font-semibold text-neutral-900">Horario</Text>
                <Text className="text-xs text-neutral-600">
                  Inicio: {draftStartISO ? new Date(draftStartISO).toLocaleString() : '-'}
                </Text>
                <Text className="text-xs text-neutral-600">
                  Objetivo: {draftEndISO ? new Date(draftEndISO).toLocaleString() : '-'}
                </Text>
                {selectedSpaceId ? (
                  <Text className="text-xs text-neutral-600 mt-1">
                    {selectedBookingsCount} en este espacio
                  </Text>
                ) : null}
                <Text className="text-xs text-neutral-600 mt-1">
                  {availability.label}
                </Text>
                {!timePolicy.ok && timePolicy.message ? (
                  <Text className="text-xs text-neutral-700 mt-1">
                    {timePolicy.message}
                  </Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="text-xs text-neutral-700">Editar hora de inicio</Text>
                <TextInput
                  value={startText}
                  onChangeText={(t) => {
                    setStartText(t);
                    const parsed = parseLocalYYYYMMDDHHMM(t);
                    if (!parsed) {
                      setStartError('Formato esperado: YYYY-MM-DD HH:mm');
                      return;
                    }
                    setStartError(null);

                    // Mantiene duración si es válida; si no, fallback a 60 min.
                    const prevStartMs = draftStartISO
                      ? new Date(draftStartISO).getTime()
                      : NaN;
                    const prevEndMs = draftEndISO ? new Date(draftEndISO).getTime() : NaN;
                    const prevDurationMin =
                      Number.isFinite(prevStartMs) && Number.isFinite(prevEndMs)
                        ? Math.max(0, Math.round((prevEndMs - prevStartMs) / 60000))
                        : 60;

                    setDraftStartISO(parsed);
                    setDraftEndISO(addMinutes(parsed, prevDurationMin || 60));
                    setEndText(
                      formatLocalYYYYMMDDHHMM(addMinutes(parsed, prevDurationMin || 60)),
                    );
                    setEndError(null);
                  }}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="rounded-xl bg-neutral-100 px-3 py-2 text-xs"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {startError ? (
                  <Text className="text-[10px] text-neutral-600">{startError}</Text>
                ) : null}
              </View>

              <View className="gap-2">
                <Text className="text-xs text-neutral-700">Editar hora fin</Text>
                <TextInput
                  value={endText}
                  onChangeText={(t) => {
                    setEndText(t);
                    const parsed = parseLocalYYYYMMDDHHMM(t);
                    if (!parsed) {
                      setEndError('Formato esperado: YYYY-MM-DD HH:mm');
                      return;
                    }
                    setEndError(null);
                    setDraftEndISO(parsed);
                  }}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="rounded-xl bg-neutral-100 px-3 py-2 text-xs"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {endError ? (
                  <Text className="text-[10px] text-neutral-600">{endError}</Text>
                ) : null}
              </View>

              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  label="−15m"
                  onPress={() => {
                    if (!draftStartISO || !draftEndISO) return;
                    const startMs = new Date(draftStartISO).getTime();
                    const endMs = new Date(draftEndISO).getTime();
                    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return;

                    const nextStartISO = new Date(startMs - 15 * 60 * 1000).toISOString();
                    const nextEndISO = new Date(endMs - 15 * 60 * 1000).toISOString();

                    setDraftStartISO(nextStartISO);
                    setDraftEndISO(nextEndISO);
                    setStartText(formatLocalYYYYMMDDHHMM(nextStartISO));
                    setEndText(formatLocalYYYYMMDDHHMM(nextEndISO));
                    setStartError(null);
                    setEndError(null);
                  }}
                />
                <Button
                  size="sm"
                  label="+15m"
                  onPress={() => {
                    if (!draftStartISO || !draftEndISO) return;
                    const startMs = new Date(draftStartISO).getTime();
                    const endMs = new Date(draftEndISO).getTime();
                    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return;

                    const nextStartISO = new Date(startMs + 15 * 60 * 1000).toISOString();
                    const nextEndISO = new Date(endMs + 15 * 60 * 1000).toISOString();

                    setDraftStartISO(nextStartISO);
                    setDraftEndISO(nextEndISO);
                    setStartText(formatLocalYYYYMMDDHHMM(nextStartISO));
                    setEndText(formatLocalYYYYMMDDHHMM(nextEndISO));
                    setStartError(null);
                    setEndError(null);
                  }}
                />
                <Button
                  size="sm"
                  label={durationMinutes === 60 ? '60→30' : '30→60'}
                  onPress={() => {
                    if (!draftStartISO) return;
                    const next = durationMinutes === 60 ? 30 : 60;
                    const nextEndISO = addMinutes(draftStartISO, next);
                    setDraftEndISO(nextEndISO);
                    setEndText(formatLocalYYYYMMDDHHMM(nextEndISO));
                    setEndError(null);
                  }}
                />
              </View>

              <View className="flex-row gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  label="Confirmar reserva (mock)"
                  disabled={!canConfirm}
                  onPress={() => {
                    if (!canConfirm) return;
                    if (!draftStartISO || !draftEndISO) return;
                    void createMockBooking(userId, {
                      startISO: draftStartISO,
                      endISO: draftEndISO,
                    });
                    closeHorarioMenu();
                  }}
                />
                <Button
                  variant="secondary"
                  size="lg"
                  label="Cerrar"
                  onPress={closeHorarioMenu}
                />
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-5">
        <Content className="gap-5">
          <AppHeader
            title="Reservas"
            subtitle={`${myBookingsCount} mías • ${bookings.length} total`}
            right={
              role === 'admin' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  label="Admin"
                  onPress={() => router.push('/(admin)/space-builder')}
                />
              ) : null
            }
          />

          {openedFromNotification ? (
            <Card className="gap-1">
              <Text className="text-xs text-neutral-700">
                Abierto desde notificación
                {deepLinkSpaceId ? ` • spaceId: ${deepLinkSpaceId}` : ''}
                {deepLinkBookingId ? ` • bookingId: ${deepLinkBookingId}` : ''}
              </Text>
            </Card>
          ) : null}

          {status === 'idle' || status === 'loading' ? (
            <LoadingState lines={4} />
          ) : status === 'error' ? (
            <ErrorState
              title="No se pudieron cargar las reservas"
              description="Revisa tu storage o vuelve a intentar."
              onRetry={() => void hydrate()}
            />
          ) : spaces.length === 0 ? (
            <EmptyState
              title="Aún no hay espacios configurados"
              description="Si eres admin, crea y guarda una configuración en Space Builder."
              actionLabel={role === 'admin' ? 'Ir a Space Builder' : undefined}
              onAction={
                role === 'admin'
                  ? () => {
                      router.push('/(admin)/space-builder');
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <Section title="Mis reservas" subtitle="Últimas 5">
                {myBookings.length === 0 ? (
                  <Card>
                    <Text className="text-xs text-neutral-600">
                      No tienes reservas todavía.
                    </Text>
                  </Card>
                ) : (
                  <View className="gap-2">
                    {myBookings.map((b) => (
                      <Card key={b.id} className="gap-2">
                        <View className="flex-row items-start justify-between gap-3">
                          <View className="flex-1">
                            <Text className="text-sm text-neutral-900">{b.spaceId}</Text>
                            <Text className="text-xs text-neutral-600 mt-0.5">
                              {new Date(b.startISO).toLocaleString()} • {b.status}
                            </Text>
                          </View>
                          {b.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              label="Cancelar"
                              onPress={() => void cancelBooking(b.id)}
                            />
                          ) : null}
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </Section>

              <Section
                title="Espacios"
                subtitle={`Seleccionado: ${selectedSpaceId ?? '-'}`}
              >
                <View className="gap-3">
                  {Object.entries(grouped).map(([groupKey, list]) => (
                    <View key={groupKey} className="gap-2">
                      <Text className="text-xs font-semibold text-neutral-700">
                        {groupKey}
                      </Text>

                      <View className="gap-2">
                        {list.map((s) => {
                          const occupied = isSpaceOccupied(s.id);
                          const isSelected = selectedSpaceId === s.id;

                          return (
                            <Pressable
                              key={s.id}
                              className={[
                                'rounded-2xl px-4 py-3',
                                isSelected
                                  ? 'bg-black'
                                  : occupied
                                    ? 'bg-neutral-200'
                                    : 'bg-neutral-100',
                              ].join(' ')}
                              onPress={() => selectSpace(s.id)}
                            >
                              <View className="flex-row items-center justify-between gap-3">
                                <View className="flex-1">
                                  <Text
                                    className={[
                                      'text-sm',
                                      isSelected ? 'text-white' : 'text-neutral-900',
                                    ].join(' ')}
                                  >
                                    {s.name}
                                  </Text>
                                  <Text
                                    className={[
                                      'text-xs mt-0.5',
                                      isSelected
                                        ? 'text-neutral-200'
                                        : 'text-neutral-600',
                                    ].join(' ')}
                                  >
                                    {s.type}
                                    {occupied ? ' • Ocupado' : ''}
                                  </Text>
                                </View>

                                {isSelected ? (
                                  <View className="rounded-full bg-white/15 px-2 py-1">
                                    <Text className="text-[10px] text-white">
                                      Seleccionado
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </Section>

              <Button
                variant="primary"
                size="lg"
                label="Crear reserva (mock)"
                disabled={!selectedSpaceId}
                onPress={() => {
                  if (!selectedSpaceId) return;
                  openHorarioMenu();
                }}
              />
            </>
          )}
        </Content>
      </ScrollView>
    </Screen>
  );
}
