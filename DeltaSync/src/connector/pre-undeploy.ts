import {
  customObjectStorage,
  deleteCustomObject,
  fetchCustomObject,
} from 'common-connect';

export async function run(): Promise<void> {
  try {
    const { container, key } = customObjectStorage.full;
    const { value } = await fetchCustomObject({ container, key });
    if (value) {
      await deleteCustomObject({
        container,
        key,
      });
    }
  } catch (error) {
    process.exitCode = 1;
  }
}

run();
