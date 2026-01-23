import type { SpaceType } from '@/features/reservas/domain/reservas.types';

export interface Area {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
}

export interface ConfiguredSpace {
  id: string;
  name: string;
  type: SpaceType;
  areaId: string;
  serviceIds: string[];
}

export interface WorkspaceConfig {
  version: number;
  areas: Area[];
  services: Service[];
  spaces: ConfiguredSpace[];
}

