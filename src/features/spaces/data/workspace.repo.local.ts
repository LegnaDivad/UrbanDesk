import type { WorkspaceConfig } from '@/features/space-builder/domain/spaceBuilder.types';
import type { WorkspaceRepo } from '@/features/spaces/data/workspace.repo';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.workspaceConfig.v1';

export const workspaceRepoLocal: WorkspaceRepo = {
  async load() {
    return (await kv.getJson<WorkspaceConfig>(KEY)) ?? null;
  },
  async save(next) {
    await kv.setJson(KEY, next);
  },
};

