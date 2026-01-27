import type { WorkspaceConfig } from '@/features/space-builder/domain/spaceBuilder.types';

export interface WorkspaceRepo {
  load(): Promise<WorkspaceConfig | null>;
  save(next: WorkspaceConfig): Promise<void>;
}

