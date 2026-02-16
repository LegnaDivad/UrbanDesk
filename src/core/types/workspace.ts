export type SpaceType = 'desk' | 'room' | 'common';

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
  /** Capacidad máxima de integrantes/reservas simultáneas en el mismo rango */
  capacity?: number;
}

export interface WorkspaceConfig {
  version: number;
  areas: Area[];
  services: Service[];
  spaces: ConfiguredSpace[];
}
