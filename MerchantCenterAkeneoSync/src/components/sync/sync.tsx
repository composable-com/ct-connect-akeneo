import React from 'react';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import Grid from '@commercetools-uikit/grid';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Card from '@commercetools-uikit/card';
import Constraints from '@commercetools-uikit/constraints';

import { apiService } from '../../services/api-service';
import SyncCard from './sync-card';
import ConfigEditorContainer from '../config-editor/config-editor-container';
import { useCustomObject } from '../../hooks/use-custom-object/use-custom-object';
import ConfigEditor from '../config-editor/config-editor';
import { DOMAINS } from '@commercetools-frontend/constants';

const SyncAppWrapper = () => {
  return <SyncApp />;
};

export default SyncAppWrapper;

const SyncApp: React.FC = () => {
  const showNotification = useShowNotification();
  const [isConfirmationOpen, setConfirmationOpen] = React.useState(false);
  const [syncTypeToConfirm, setSyncTypeToConfirm] = React.useState<
    'delta' | 'full' | null
  >(null);
  const [hasSeenWelcome, setHasSeenWelcome] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const { data, loading, refetch } = useCustomObject({
    container: 'ct-connect-akeneo',
    key: 'sync-config',
  });

  const { url, config } = JSON.parse(data?.customObject?.value ?? '{}');

  const isConfigured = Boolean(config);

  const handleTriggerSync = async (syncType: 'delta' | 'full') => {
    try {
      if (!url) {
        throw new Error('Akeneo URL not configured');
      }
      return await apiService.post(
        {
          action: 'start',
          syncType,
        },
        {
          forwardTo: url,
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const handleCancelSync = async (syncType: 'delta' | 'full') => {
    try {
      if (!url) {
        throw new Error('Akeneo URL not configured');
      }
      return await apiService.post(
        {
          action: 'stop',
          syncType,
        },
        {
          forwardTo: url,
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const getCurrentStatus = async (syncType: 'delta' | 'full') => {
    try {
      if (!url) {
        throw new Error('Akeneo URL not configured');
      }

      return await apiService.post(
        {
          action: 'get',
          syncType,
        },
        {
          forwardTo: url,
          headers: {
            Cookie: document.cookie,
          },
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const handleSave = async (config: string) => {
    await apiService.post(
      {
        action: 'save',
        syncType: 'all',
        config,
      },
      {
        forwardTo: url,
      }
    );

    showNotification({
      kind: 'success',
      domain: DOMAINS.SIDE,
      text: 'Configuration saved successfully',
    });

    setIsEditing(false);

    refetch();
  };

  if (loading) {
    return (
      <Spacings.Inset scale="l">
        <Constraints.Horizontal max={16}>
          <Spacings.Stack scale="xl">
            <Spacings.Stack scale="l" alignItems="center">
              <LoadingSpinner scale="l" />
              <Text.Headline as="h1">
                Loading Akeneo Sync Dashboard...
              </Text.Headline>
            </Spacings.Stack>
          </Spacings.Stack>
        </Constraints.Horizontal>
      </Spacings.Inset>
    );
  }

  // Show welcome screen for first-time users
  if (!hasSeenWelcome && !isConfigured) {
    return (
      <Spacings.Stack scale="l" alignItems="center">
        <Constraints.Horizontal max={16}>
          <Spacings.Stack scale="xl">
            <Spacings.Stack scale="l" alignItems="center">
              <Text.Headline as="h1">Welcome to Akeneo Sync!</Text.Headline>
              <Text.Body>
                Streamline your product data management by connecting Akeneo PIM
                with commercetools. We'll guide you through the setup process to
                ensure smooth data synchronization.
              </Text.Body>
            </Spacings.Stack>

            <Spacings.Stack scale="l">
              <Text.Subheadline as="h4">
                Here's what you'll need to do:
              </Text.Subheadline>
              <Grid
                gridGap="24px"
                gridAutoColumns="1fr"
                gridTemplateColumns="repeat(2, 1fr)"
              >
                <Card type="raised" theme="light" insetScale="l">
                  <Spacings.Inline alignItems="flex-start" scale="l">
                    <div className="step-number">
                      <Text.Headline as="h3">1</Text.Headline>
                    </div>
                    <Spacings.Stack>
                      <Text.Headline as="h3" tone="primary">
                        Map Your Data
                      </Text.Headline>
                      <Text.Detail tone="secondary">
                        Define how your Akeneo product attributes map to
                        commercetools fields for seamless integration. Set up
                        attribute mappings to ensure accurate data transfer
                        between systems.
                      </Text.Detail>
                    </Spacings.Stack>
                  </Spacings.Inline>
                </Card>

                <Card type="raised" theme="light" insetScale="l">
                  <Spacings.Inline alignItems="flex-start" scale="l">
                    <div className="step-number">
                      <Text.Headline as="h3">2</Text.Headline>
                    </div>
                    <Spacings.Stack>
                      <Text.Headline as="h3" tone="primary">
                        Start Syncing
                      </Text.Headline>
                      <Text.Detail tone="secondary">
                        Begin synchronizing your product data automatically with
                        real-time monitoring and control. Choose between full or
                        delta syncs based on your needs.
                      </Text.Detail>
                    </Spacings.Stack>
                  </Spacings.Inline>
                </Card>
              </Grid>
            </Spacings.Stack>

            <Spacings.Stack scale="l" alignItems="center">
              <PrimaryButton
                onClick={() => setHasSeenWelcome(true)}
                label="Get Started"
              />
            </Spacings.Stack>
          </Spacings.Stack>
        </Constraints.Horizontal>
      </Spacings.Stack>
    );
  }

  // Show configuration required screen
  if (!isConfigured) {
    return (
      <Spacings.Stack scale="l" alignItems="center">
        <Constraints.Horizontal max={16}>
          <Spacings.Stack scale="xl">
            <Spacings.Stack scale="l" alignItems="center">
              <Text.Headline as="h1">
                Let's Set Up Your Data Mapping
              </Text.Headline>
              <Text.Body>
                Define how your Akeneo product data maps to commercetools to
                ensure accurate synchronization.
              </Text.Body>
            </Spacings.Stack>

            <Spacings.Stack scale="l">
              <ConfigEditor initialConfig={''} onSave={handleSave} />
            </Spacings.Stack>
          </Spacings.Stack>
        </Constraints.Horizontal>
      </Spacings.Stack>
    );
  }

  // Show main dashboard
  return (
    <Constraints.Horizontal>
      <Spacings.Stack scale="s">
        <Text.Headline as="h1">Sync Dashboard</Text.Headline>
        <Text.Detail tone="secondary">
          Monitor and manage your synchronization processes
        </Text.Detail>
      </Spacings.Stack>

      <Spacings.Stack scale="s">
        <div style={{ height: '20px' }} />
      </Spacings.Stack>

      <Spacings.Stack scale="s">
        <div style={{ height: '20px' }} />
      </Spacings.Stack>

      <Spacings.Inline scale="xl" alignItems="center">
        <ConfigEditorContainer
          isEditing={isEditing}
          onEditingChange={setIsEditing}
          onSave={handleSave}
          config={JSON.stringify(config, null, 2)}
        />
      </Spacings.Inline>
      <Spacings.Stack scale="s">
        <div style={{ height: '20px' }} />
      </Spacings.Stack>

      {!isEditing && (
        <Grid gridGap="16px" gridTemplateColumns="1fr 1fr">
          <Grid.Item>
            <SyncCard
              type="full"
              onSync={() => {
                setSyncTypeToConfirm('full');
                setConfirmationOpen(true);
                return Promise.resolve();
              }}
              onCancel={() => handleCancelSync('full')}
              getStatus={() => getCurrentStatus('full')}
            />
          </Grid.Item>
          <Grid.Item>
            <SyncCard
              type="delta"
              onSync={() => {
                setSyncTypeToConfirm('delta');
                setConfirmationOpen(true);
                return Promise.resolve();
              }}
              onCancel={() => handleCancelSync('delta')}
              getStatus={() => getCurrentStatus('delta')}
            />
          </Grid.Item>
        </Grid>
      )}

      {isConfirmationOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <Card>
            <Spacings.Stack scale="l" alignItems="center">
              <Text.Headline as="h3">Confirm Sync Operation</Text.Headline>
              <Text.Body>
                Are you sure you want to start a {syncTypeToConfirm} sync?
              </Text.Body>
              <Spacings.Inline scale="s" justifyContent="flex-end">
                <SecondaryButton
                  onClick={() => setConfirmationOpen(false)}
                  label="Cancel"
                />
                <PrimaryButton
                  onClick={() => {
                    if (syncTypeToConfirm) {
                      handleTriggerSync(syncTypeToConfirm);
                      setConfirmationOpen(false);
                    }
                  }}
                  label="Confirm"
                />
              </Spacings.Inline>
            </Spacings.Stack>
          </Card>
        </div>
      )}
    </Constraints.Horizontal>
  );
};
