import {
  updateCustomObject,
  customObjectStorage,
  JobStatus,
  fetchCustomObject,
} from 'common-connect';

export async function run(): Promise<void> {
  try {
    const { container, key } = customObjectStorage.delta;
    const { value } = await fetchCustomObject({ container, key });
    if (!value) {
      await updateCustomObject({
        container,
        key,
        value: JSON.stringify({
          status: JobStatus.SCHEDULED,
        }),
      });
    }
  } catch (error) {
    process.exitCode = 1;
  }
}

run();
