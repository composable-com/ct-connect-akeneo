import React, { useState } from 'react';

import Card from '@commercetools-uikit/card';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import TextInput from '@commercetools-uikit/text-input';
import FieldLabel from '@commercetools-uikit/field-label';
import { Settings } from 'lucide-react';
import styled from '@emotion/styled';

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 16px;
  border-bottom: ${(props: { isExpanded: boolean }) =>
    props.isExpanded ? '1px solid #E5E7EB' : 'none'};
`;

interface SettingsFormProps {
  onSave: (settings: SettingsData) => void;
}

export interface SettingsData {
  triggerSyncEndpoint: string;
  getSyncStatusEndpoint: string;
}

export default function SettingsForm({ onSave }: SettingsFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<SettingsData>({
    triggerSyncEndpoint: '',
    getSyncStatusEndpoint: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
      setIsExpanded(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange =
    (field: keyof SettingsData) => (event: { target: { value: string } }) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  return (
    <Card>
      <SettingsHeader
        onClick={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      >
        <Settings size={20} color="#4F46E5" />
        <Text.Headline as="h3">Settings</Text.Headline>
      </SettingsHeader>

      {isExpanded && (
        <form onSubmit={handleSubmit} style={{ padding: '20px 16px' }}>
          <Spacings.Stack scale="m">
            <Spacings.Stack scale="xs">
              <FieldLabel
                title="Trigger Sync Endpoint"
                hasRequiredIndicator
                horizontalConstraint={7}
              />
              <TextInput
                value={formData.triggerSyncEndpoint}
                onChange={handleChange('triggerSyncEndpoint')}
                horizontalConstraint={7}
                placeholder="https://api.example.com/v1"
              />
            </Spacings.Stack>

            <Spacings.Stack scale="xs">
              <FieldLabel
                title="Get Sync Status Endpoint"
                hasRequiredIndicator
                horizontalConstraint={7}
              />
              <TextInput
                value={formData.getSyncStatusEndpoint}
                onChange={handleChange('getSyncStatusEndpoint')}
                horizontalConstraint={7}
                placeholder="https://api.example.com/v1"
              />
            </Spacings.Stack>

            <Spacings.Inline scale="s">
              <SecondaryButton
                onClick={() => setIsExpanded(false)}
                label="Cancel"
                type="button"
              />
              <PrimaryButton
                isDisabled={isSaving}
                label={isSaving ? 'Saving...' : 'Save Settings'}
                type="submit"
              />
            </Spacings.Inline>
          </Spacings.Stack>
        </form>
      )}
    </Card>
  );
}
