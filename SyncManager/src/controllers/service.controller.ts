import { Request, Response } from 'express';
import {
  createJobHandler,
  customObjectStorage,
  fetchCustomObject,
  JobStatus,
  updateCustomObject,
} from 'common-connect';

/**
 * Exposed service endpoint.
 *
 * @param {Request} request The express request
 * @param {Response} response The express response
 * @returns
 */

export const post = async (request: Request, response: Response) => {
  const { action, syncType, config } = request.body;

  const { container, key } =
    customObjectStorage[syncType as 'delta' | 'full' | 'all'];

  if (action === 'save') {
    const { value } = await fetchCustomObject({ container, key });

    await updateCustomObject({
      container,
      key,
      value: JSON.stringify({
        ...(value ? JSON.parse(value) : {}),
        config: JSON.parse(config),
      }),
    });

    return { status: 'success' };
  }

  const { checkJobStatus, startJobHandler, cancelJobHandler, stopJobHandler } =
    createJobHandler({
      container,
      key,
    });

  const jobStatus = await checkJobStatus();
  const { status } = jobStatus;

  if (action === 'start') {
    if (status === JobStatus.RUNNING || status === JobStatus.RESUMABLE) {
      return { status };
    }

    if (
      status === JobStatus.SCHEDULED ||
      status === JobStatus.STOPPED ||
      status === JobStatus.IDLE
    ) {
      await startJobHandler();

      return {
        status: JobStatus.SCHEDULED,
      };
    }
  }

  if (action === 'stop' && status !== JobStatus.TO_STOP) {
    if (syncType === 'full') {
      await cancelJobHandler();
      return { status: JobStatus.STOPPED };
    }

    await stopJobHandler();

    return { status: JobStatus.TO_STOP };
  }

  if (action === 'get') {
    return {
      ...jobStatus,
    };
  }
};
