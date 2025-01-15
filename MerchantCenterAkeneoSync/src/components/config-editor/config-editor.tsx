import { useEffect, useState } from 'react';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { ContentNotification } from '@commercetools-uikit/notifications';
import Text from '@commercetools-uikit/text';
import styled from '@emotion/styled';
import { z } from 'zod';

const CommercetoolsCoreFields = z.enum(['name', 'description', 'slug']);

const ListMapping = z
  .object({
    commercetoolsAttribute: z
      .string()
      .min(1, 'commercetoolsAttribute is required'),
  })
  .catchall(z.string());

const FamilyConfig = z.object({
  commercetoolsProductTypeId: z.string().min(1, 'Product Type ID is required'),
  commercetoolsProductTypeLabel: z.string().optional(),
  akeneoImagesAttribute: z.string().min(1, 'Images attribute is required'),
  akeneoSkuField: z.string().optional(),
  coreAttributeMapping: z.record(CommercetoolsCoreFields),
  attributeMapping: z.record(z.union([z.string(), ListMapping])),
});

const CategoryMapping = z.object({
  commercetoolsCategoryid: z.string().min(1, 'Category ID is required'),
  label: z.string().optional(),
});

const ConfigSchema = z.object({
  familyMapping: z.record(FamilyConfig),
  localeMapping: z.record(
    z.string().min(1, 'Locale mapping value is required')
  ),
  categoryMapping: z.record(CategoryMapping),
  akeneoScope: z.string().min(1, 'Akeneo scope is required'),
});

const EditorWrapper = styled.div`
  height: 500px;
  border: 1px solid var(--color-neutral-90);
  border-radius: var(--border-radius-6);
  overflow: hidden;
  background: var(--color-surface);
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 16px 16px 16px 56px;
  border: none;
  resize: none;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono',
    'Droid Sans Mono', 'Source Code Pro', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-primary);
  background: transparent;
  outline: none;
  tab-size: 2;

  &:focus {
    box-shadow: none;
  }

  &::placeholder {
    color: var(--color-neutral-60);
  }
`;

const LineNumbers = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  padding: 16px 8px;
  background: var(--color-neutral-98);
  border-right: 1px solid var(--color-neutral-90);
  color: var(--color-neutral-60);
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  text-align: right;
  user-select: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--spacing-m);
  justify-content: flex-end;
  margin-top: var(--spacing-m);
`;

const ErrorMessage = styled.pre`
  margin: 0;
  font-family: inherit;
`;

const StackWrapper = styled.div`
  width: 100%;
`;

interface ConfigEditorProps {
  initialConfig: string;
  onSave: (config: string) => Promise<void>;
  onCancel?: () => void;
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
  details?: {
    familyCount: number;
    categoryCount: number;
    localeCount: number;
  };
}

const validateConfig = (config: unknown): ValidationResult => {
  try {
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      const formattedError = result.error.issues
        .map((issue: z.ZodIssue) => {
          const path = issue.path.join('.');
          return `${path ? `${path}: ` : ''}${issue.message}`;
        })
        .join('\n');
      return { isValid: false, error: formattedError };
    }

    // Add validation details
    const typedConfig = result.data;
    return {
      isValid: true,
      error: null,
      details: {
        familyCount: Object.keys(typedConfig.familyMapping).length,
        categoryCount: Object.keys(typedConfig.categoryMapping).length,
        localeCount: Object.keys(typedConfig.localeMapping).length,
      },
    };
  } catch (e) {
    return { isValid: false, error: 'Invalid configuration structure' };
  }
};

const ConfigEditor: React.FC<ConfigEditorProps> = ({
  initialConfig,
  onSave,
  onCancel,
}) => {
  const [editorContent, setEditorContent] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] =
    useState<ValidationResult['details']>();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditorContent(initialConfig);
  }, [initialConfig]);

  const handleEditorChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setEditorContent(value);
    setIsDirty(value !== initialConfig);

    try {
      const parsedConfig = JSON.parse(value);
      const validation = validateConfig(parsedConfig);
      setError(validation.error);
      setValidationDetails(validation.details);
    } catch (e) {
      setError('Invalid JSON format');
      setValidationDetails(undefined);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const parsedConfig = JSON.parse(editorContent);
      const validation = validateConfig(parsedConfig);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid configuration');
      }

      await onSave(editorContent);
      setIsDirty(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsedConfig = JSON.parse(editorContent);
      const validation = validateConfig(parsedConfig);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid configuration');
        setValidationDetails(undefined);
        return;
      }
      const formatted = JSON.stringify(parsedConfig, null, 2);
      setEditorContent(formatted);
      setError(null);
      setValidationDetails(validation.details);
    } catch (e) {
      setError('Cannot format invalid JSON');
      setValidationDetails(undefined);
    }
  };

  // Calculate line numbers
  const lineCount = editorContent.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <StackWrapper>
      <Spacings.Stack scale="xl">
        {editorContent && editorContent !== '{}' ? (
          error ? (
            <ContentNotification type="error">
              <ErrorMessage>{error}</ErrorMessage>
            </ContentNotification>
          ) : (
            validationDetails && (
              <ContentNotification type="success">
                <Text.Body>
                  Configuration is valid with {validationDetails.familyCount}{' '}
                  product families, {validationDetails.categoryCount}{' '}
                  categories, and {validationDetails.localeCount} locale
                  mappings.
                </Text.Body>
              </ContentNotification>
            )
          )
        ) : (
          <ContentNotification type="info">
            <Text.Body>Start by entering your configuration below.</Text.Body>
          </ContentNotification>
        )}

        <EditorWrapper>
          <LineNumbers>
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </LineNumbers>
          <StyledTextArea
            value={editorContent}
            onChange={handleEditorChange}
            spellCheck={false}
            data-testid="config-editor"
            placeholder={`Enter your configuration here. Example:
{
  "familyMapping": {
    "your_akeneo_family": {
      "commercetoolsProductTypeId": "your-product-type-id",
      "akeneoImagesAttribute": "images",
      "coreAttributeMapping": {
        "name": "name",
        "description": "description",
        "slug": "slug"
      },
      "attributeMapping": {
        "size": "size",
        "color": "color"
      }
    }
  },
  "categoryMapping": {
    "akeneo_category": {
      "commercetoolsCategoryid": "ct-category-id"
    }
  },
  "localeMapping": {
    "en_US": "en-US",
    "fr_FR": "fr-FR"
  },
  "akeneoScope": "ecommerce"
}`}
          />
        </EditorWrapper>

        <ButtonGroup>
          {editorContent && editorContent !== '{}' && onCancel && (
            <SecondaryButton
              onClick={onCancel}
              label="Cancel"
              isDisabled={isSaving}
            />
          )}
          <SecondaryButton
            onClick={handleFormat}
            label="Format JSON"
            isDisabled={isSaving}
          />
          <PrimaryButton
            onClick={handleSave}
            isDisabled={!isDirty || Boolean(error) || isSaving}
            label={isSaving ? 'Saving...' : 'Save Changes'}
          />
        </ButtonGroup>
      </Spacings.Stack>
    </StackWrapper>
  );
};

export default ConfigEditor;
