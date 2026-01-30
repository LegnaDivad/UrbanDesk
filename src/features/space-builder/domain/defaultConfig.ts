import type { WorkspaceConfig } from '@/core/types/workspace';

export function createDefaultWorkspaceConfig(): WorkspaceConfig {
  return {
    version: 1,
    areas: [
      { id: 'area-1', name: 'Open Space' },
      { id: 'area-2', name: 'Salas' },
    ],
    services: [
      { id: 'svc-1', name: 'WiFi' },
      { id: 'svc-2', name: 'Café' },
      { id: 'svc-3', name: 'Proyector' },
    ],
    spaces: [
      {
        id: 'desk-1',
        name: 'Desk 01',
        type: 'desk',
        areaId: 'area-1',
        serviceIds: ['svc-1'],
      },
      {
        id: 'desk-2',
        name: 'Desk 02',
        type: 'desk',
        areaId: 'area-1',
        serviceIds: ['svc-1', 'svc-2'],
      },
      {
        id: 'room-1',
        name: 'Sala A',
        type: 'room',
        areaId: 'area-2',
        serviceIds: ['svc-1', 'svc-3'],
      },
      {
        id: 'common-1',
        name: 'Zona Común',
        type: 'common',
        areaId: 'area-1',
        serviceIds: ['svc-1'],
      },
    ],
  };
}
