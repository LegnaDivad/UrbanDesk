import type { WorkspaceConfig } from '@/core/types/workspace';

export interface WorkspaceRepo {
  load(): Promise<WorkspaceConfig | null>;
  save(next: WorkspaceConfig): Promise<void>;
}
