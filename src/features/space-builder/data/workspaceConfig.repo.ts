import type { WorkspaceConfig } from '@/core/types/workspace';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.workspace-config.v1';

export async function loadWorkspaceConfig(): Promise<WorkspaceConfig | null> {
  const raw = await kv.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkspaceConfig;
  } catch {
    return null;
  }
}

export async function saveWorkspaceConfig(config: WorkspaceConfig): Promise<void> {
  await kv.setItem(KEY, JSON.stringify(config));
}
