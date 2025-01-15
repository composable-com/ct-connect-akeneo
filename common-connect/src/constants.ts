const SYNC_MANAGER_CONTAINER = "ct-connect-akeneo";

export const syncManager = {
  container: SYNC_MANAGER_CONTAINER,
  key: "sync-config",
};

type SyncType = "delta" | "full" | "all";

export type CustomObjectStorage = Record<
  SyncType,
  {
    container: string;
    key: string;
  }
>;

export const customObjectStorage: CustomObjectStorage = {
  delta: {
    container: SYNC_MANAGER_CONTAINER,
    key: "delta-sync",
  },
  full: {
    container: SYNC_MANAGER_CONTAINER,
    key: "full-sync",
  },
  all: syncManager,
};
