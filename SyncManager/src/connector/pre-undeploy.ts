import {
  customObjectStorage,
  deleteCustomObject,
  fetchCustomObject,
  syncManager,
} from 'common-connect';

export async function run(): Promise<void> {
  try {
    for (const { container, key } of Object.values(customObjectStorage)) {
      const { value } = await fetchCustomObject({ container, key });
      if (value) {
        await deleteCustomObject({
          container,
          key,
        });
      }
    }

    await deleteCustomObject(syncManager);
  } catch (error) {
    process.exitCode = 1;
  }
}

run();
