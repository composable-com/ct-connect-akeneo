import { useEffect, useState } from 'react';

import {
  ArrowsMinimizeIcon,
  CheckInactiveIcon,
  CircleIcon,
  ClockIcon,
  SortingIcon,
} from '@commercetools-uikit/icons';
import Card from '@commercetools-uikit/card';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import { ExpandIcon } from '@commercetools-uikit/icons';

import styled from '@emotion/styled';
import ErrorList from './error-list';
import { JobStatus, JobStatusType } from '../../types/status';
import { css, keyframes } from '@emotion/react';

// interface SyncError {
//   id: string;
//   message: string;
//   timestamp: string;
// }

interface SyncCardProps {
  type: 'delta' | 'full';
  onSync: () => Promise<any>;
  onCancel: () => Promise<any>;
  getStatus: () => Promise<JobStatus>;
}

const fadeInOut = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const StatusIcon = styled.div`
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${({ status }: { status: JobStatusType }) =>
    status === JobStatus.TO_STOP
      ? css`
          ${fadeInOut} 1.5s infinite
        `
      : 'none'};
`;

const statusConfig = {
  [JobStatus.IDLE]: {
    icon: CircleIcon,
    color: 'neutral60',
    bg: '#F3F4F6',
    text: 'IDLE',
  },
  [JobStatus.SCHEDULED]: {
    icon: ClockIcon,
    color: 'neutral60',
    bg: '#F3F4F6',
    text: 'SCHEDULED',
  },
  [JobStatus.RUNNING]: {
    icon: SortingIcon,
    color: 'success',
    bg: '#DBEAFE',
    text: 'SYNCING',
  },
  [JobStatus.STOPPED]: {
    icon: CheckInactiveIcon,
    color: 'error',
    bg: '#FEE2E2',
    text: 'STOPPED',
  },
  [JobStatus.TO_STOP]: {
    icon: CheckInactiveIcon,
    color: 'surface',
    bg: '#FEE2E2',
    text: 'STOPPING',
  },
  [JobStatus.UNKNOWN]: {
    icon: ClockIcon,
    color: 'neutral60',
    bg: '#F3F4F6',
    text: 'UNKNOWN',
  },
};

const REFRESH_STATUS_INTERVAL = 60000; // 1 minute

export default function SyncCard({
  type,
  onSync,
  onCancel,
  getStatus,
}: SyncCardProps) {
  const [showErrors, setShowErrors] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    JobStatus & { lastUpdate: string }
  >({
    status: 'unknown',
    totalToSync: 0,
    remainingToSync: 0,
    failedSyncs: [],
    lastUpdate: '',
  });

  const StatusIconComponent = statusConfig[syncStatus.status].icon;
  const hasErrors = (syncStatus.failedSyncs?.length ?? 0) > 0;

  // update the sync status each each minute
  useEffect(() => {
    const updateStatus = () => {
      getStatus().then((job: JobStatus) => {
        const { status, totalToSync, remainingToSync, failedSyncs } = job;
        setSyncStatus({
          status,
          totalToSync: totalToSync ?? 0,
          remainingToSync: remainingToSync ?? 0,
          failedSyncs:
            failedSyncs?.map(({ date, errorMessage, identifier }) => ({
              date,
              identifier,
              errorMessage,
            })) ?? [],
          lastUpdate: new Date().toLocaleString(),
        });
      });
    };
    updateStatus();

    const interval = setInterval(updateStatus, REFRESH_STATUS_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return syncStatus.status === JobStatus.UNKNOWN ? null : (
    <Card>
      <Spacings.Stack scale="m">
        <Spacings.Inline justifyContent="space-between" alignItems="flex-start">
          <div>
            <Text.Headline as="h3">
              {type === 'delta' ? 'Delta Sync' : 'Full Sync'}
            </Text.Headline>
            <Text.Detail tone="secondary">
              {type === 'delta'
                ? 'Synchronize recent changes only'
                : 'Complete system synchronization'}
            </Text.Detail>
          </div>
          <StatusIcon
            style={{
              backgroundColor: statusConfig[syncStatus.status].bg,
            }}
            status={syncStatus.status as JobStatusType}
          >
            <StatusIconComponent
              size="big"
              color={statusConfig[syncStatus.status].color as any}
            />
          </StatusIcon>
        </Spacings.Inline>

        {/* Status */}
        <Spacings.Stack scale="s">
          <Spacings.Inline justifyContent="space-between">
            <Text.Detail tone="secondary">Status</Text.Detail>
            <Text.Detail>{statusConfig[syncStatus.status].text}</Text.Detail>
          </Spacings.Inline>
        </Spacings.Stack>

        <Spacings.Stack scale="s">
          <Spacings.Inline justifyContent="space-between">
            <Text.Detail tone="secondary">Last Update</Text.Detail>
            <Text.Detail>{syncStatus.lastUpdate || 'TBD'}</Text.Detail>
          </Spacings.Inline>

          {Number(syncStatus.totalToSync) > 0 && (
            <Spacings.Inline justifyContent="space-between">
              <Text.Detail tone="secondary">Total Items</Text.Detail>
              <Text.Detail>
                {syncStatus.totalToSync?.toLocaleString()}
              </Text.Detail>
            </Spacings.Inline>
          )}
        </Spacings.Stack>

        <Spacings.Stack scale="s">
          <Spacings.Inline justifyContent="space-between">
            <Text.Detail tone="secondary">Progress</Text.Detail>
            <Text.Detail>
              {syncStatus.totalToSync
                ? `${
                    ((syncStatus.totalToSync -
                      (syncStatus.remainingToSync ?? 0)) /
                      (syncStatus.totalToSync ?? 1)) *
                    100
                  }%`
                : 'TBD'}
            </Text.Detail>
          </Spacings.Inline>
        </Spacings.Stack>

        <Spacings.Stack scale="s" alignItems="flexEnd">
          <Spacings.Inline>
            <PrimaryButton
              onClick={async () => {
                await onSync();
                setSyncStatus({
                  ...syncStatus,
                  status: JobStatus.SCHEDULED,
                });
              }}
              isDisabled={
                syncStatus.status === JobStatus.RUNNING ||
                syncStatus.status === JobStatus.RESUMABLE ||
                syncStatus.status === JobStatus.SCHEDULED ||
                syncStatus.status === JobStatus.TO_STOP
              }
              label={
                syncStatus.status === JobStatus.RUNNING
                  ? 'Syncing...'
                  : 'Start Sync'
              }
            />
            <SecondaryButton
              onClick={async () => {
                await onCancel();
                setSyncStatus({
                  ...syncStatus,
                  status: JobStatus.TO_STOP,
                });
              }}
              label="Cancel Sync"
              isDisabled={
                syncStatus.status === JobStatus.STOPPED ||
                syncStatus.status === JobStatus.TO_STOP
              }
            />
          </Spacings.Inline>
        </Spacings.Stack>

        {hasErrors && (
          <Spacings.Stack scale="s">
            <PrimaryButton
              onClick={() => {
                setShowErrors(!showErrors);
              }}
              tone={
                syncStatus.failedSyncs?.length &&
                syncStatus.failedSyncs?.length < 100
                  ? 'urgent'
                  : 'critical'
              }
              iconLeft={
                showErrors ? (
                  <ArrowsMinimizeIcon size="small" />
                ) : (
                  <ExpandIcon size="small" />
                )
              }
              label={`${showErrors ? 'Hide' : 'Show'} Errors (${
                syncStatus.failedSyncs?.length ?? 0
              })`}
            />

            {showErrors && (
              <ErrorList
                errors={
                  syncStatus.failedSyncs?.map(
                    ({ date, identifier, errorMessage }) => ({
                      id: identifier,
                      message: errorMessage,
                      timestamp: date,
                    })
                  ) ?? []
                }
              />
            )}
          </Spacings.Stack>
        )}
      </Spacings.Stack>
    </Card>
  );
}
