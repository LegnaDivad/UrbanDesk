import { useRouter, useSegments } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useNavHistoryStore } from './nav-history.store';

type Options = {
  fallbackHref: string;
};

function inGroup(href: string, group: string) {
  const prefix = `/${group}`;
  return href === prefix || href.startsWith(`${prefix}/`);
}

/**
 * Back "seguro": intenta volver a la pantalla previa dentro del mismo grupo
 * (ej. (app) o (admin)). Si no hay historial útil, usa fallback.
 */
export function useSafeBack({ fallbackHref }: Options) {
  const router = useRouter();
  const segments = useSegments();
  const stack = useNavHistoryStore((s) => s.stack);

  const currentHref = useMemo(() => {
    if (!segments?.length) return null;
    return `/${segments.join('/')}`;
  }, [segments]);

  const group = segments?.[0] ?? null;

  return useCallback(() => {
    if (!currentHref || !group) {
      if (router.canGoBack()) router.back();
      else router.replace(fallbackHref as any);
      return;
    }

    // Busca el último href anterior dentro del mismo grupo.
    for (let i = stack.length - 2; i >= 0; i -= 1) {
      const candidate = stack[i];
      if (candidate && candidate !== currentHref && inGroup(candidate, group)) {
        router.replace(candidate as any);
        return;
      }
    }

    // Si no hay historial dentro del grupo, no volvemos "a ciegas" (podría caer en login).
    router.replace(fallbackHref as any);
  }, [currentHref, group, router, stack, fallbackHref]);
}
