import { updateCustomObject, syncManager } from 'common-connect';

export async function run(): Promise<void> {
  try {
    const serviceUrl = process.env.CONNECT_SERVICE_URL;

    await updateCustomObject({
      ...syncManager,
      value: JSON.stringify({
        url: serviceUrl ?? '',
        config: '',
      }),
    });
  } catch (error) {
    process.exitCode = 1;
  }
}

run();
