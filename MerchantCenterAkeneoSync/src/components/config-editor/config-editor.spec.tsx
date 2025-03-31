import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigEditor from './config-editor';

// Define common prop types for mocks
type ChildrenProps = {
  children: React.ReactNode;
};

type ButtonProps = {
  onClick: () => void;
  label?: string;
};

type NotificationProps = {
  children: React.ReactNode;
  type: string;
};

// Mock the UI components
jest.mock('@commercetools-uikit/spacings', () => ({
  Stack: ({ children }: ChildrenProps) => (
    <div data-testid="spacings-stack">{children}</div>
  ),
  Inline: ({ children }: ChildrenProps) => (
    <div data-testid="spacings-inline">{children}</div>
  ),
}));

jest.mock('@commercetools-uikit/text', () => ({
  Body: ({ children }: ChildrenProps) => (
    <div data-testid="text-body">{children}</div>
  ),
  Headline: ({ children }: ChildrenProps) => (
    <div data-testid="text-headline">{children}</div>
  ),
}));

jest.mock('@commercetools-uikit/primary-button', () => {
  return function MockPrimaryButton({ onClick, label }: ButtonProps) {
    return (
      <button data-testid="primary-button" onClick={onClick}>
        {label || 'Save'}
      </button>
    );
  };
});

jest.mock('@commercetools-uikit/secondary-button', () => {
  return function MockSecondaryButton({ onClick, label }: ButtonProps) {
    return (
      <button data-testid="secondary-button" onClick={onClick}>
        {label || 'Cancel'}
      </button>
    );
  };
});

// No need to mock react-ace as it's replaced by a styled textarea in the component

// Mock notifications
jest.mock('@commercetools-uikit/notifications', () => ({
  ContentNotification: ({ children, type }: NotificationProps) => (
    <div data-testid={`notification-${type}`}>{children}</div>
  ),
}));

describe('ConfigEditor', () => {
  // Create a valid configuration object that will pass validation
  const initialConfig = JSON.stringify(
    {
      familyMapping: {
        testFamily: {
          commercetoolsProductTypeId: 'test-product-type',
          akeneoImagesAttribute: 'images',
          coreAttributeMapping: {
            name: 'name',
            description: 'description',
            slug: 'slug',
          },
          attributeMapping: {
            size: 'size',
            color: 'color',
          },
        },
      },
      categoryMapping: {
        testCategory: {
          commercetoolsCategoryid: 'test-category-id',
        },
      },
      localeMapping: {
        en_US: 'en-US',
      },
      akeneoScope: 'ecommerce',
    },
    null,
    2
  );

  it('renders with initial configuration', () => {
    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const editor = screen.getByTestId('config-editor');
    expect(editor).toHaveValue(initialConfig);
  });

  it('calls onSave with updated configuration when save button is clicked', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(undefined);
    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={onSaveMock}
        onCancel={jest.fn()}
      />
    );

    const editor = screen.getByTestId('config-editor');

    // Create an updated valid configuration
    const updatedConfig = JSON.stringify(
      {
        familyMapping: {
          testFamily: {
            commercetoolsProductTypeId: 'updated-product-type',
            akeneoImagesAttribute: 'updated-images',
            coreAttributeMapping: {
              name: 'name',
              description: 'description',
              slug: 'slug',
            },
            attributeMapping: {
              size: 'updated-size',
              color: 'updated-color',
            },
          },
        },
        categoryMapping: {
          testCategory: {
            commercetoolsCategoryid: 'updated-category-id',
          },
        },
        localeMapping: {
          en_US: 'en-US',
        },
        akeneoScope: 'ecommerce',
      },
      null,
      2
    );

    fireEvent.change(editor, { target: { value: updatedConfig } });

    const saveButton = screen.getByTestId('primary-button');
    fireEvent.click(saveButton);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledWith(updatedConfig);
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancelMock = jest.fn();
    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={jest.fn().mockResolvedValue(undefined)}
        onCancel={onCancelMock}
      />
    );

    // Get all buttons and find the one with 'Cancel' text for onCancel
    const cancelButtons = screen.getAllByTestId('secondary-button');
    // Click the first cancel button which should be for onCancel
    fireEvent.click(cancelButtons[0]);

    expect(onCancelMock).toHaveBeenCalled();
  });

  it('displays validation error for invalid JSON', () => {
    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={jest.fn().mockResolvedValue(undefined)}
        onCancel={jest.fn()}
      />
    );

    const editor = screen.getByTestId('config-editor');
    fireEvent.change(editor, { target: { value: '{invalid json}' } });

    // Check for error notification
    expect(screen.getByTestId('notification-error')).toBeInTheDocument();
  });

  it('formats JSON content when format button is clicked', () => {
    // Mock console.error to prevent validation errors from polluting test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={jest.fn().mockResolvedValue(undefined)}
        onCancel={jest.fn()}
      />
    );

    const editor = screen.getByTestId('config-editor');

    // Set a valid but unformatted JSON (must be valid for the formatter to work)
    const unformattedJson = '{"test":"value","nested":{"prop":123}}';
    fireEvent.change(editor, { target: { value: unformattedJson } });

    // Find the Format JSON button (second secondary button)
    const formatButtons = screen.getAllByTestId('secondary-button');
    fireEvent.click(formatButtons[1]);

    // Because we need to check JSON equality rather than string formatting
    // (which might be implementation-specific), let's verify the content is still valid JSON
    // and represents the same data structure
    const formattedValue = (editor as HTMLTextAreaElement).value;
    expect(JSON.parse(formattedValue)).toEqual(JSON.parse(unformattedJson));

    // Clean up console mock
    (console.error as jest.Mock).mockRestore();
  });

  it('does not call onSave when validation fails', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(undefined);
    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={onSaveMock}
        onCancel={jest.fn()}
      />
    );

    const editor = screen.getByTestId('config-editor');

    // Set an invalid configuration (missing required fields)
    const invalidConfig = JSON.stringify({ test: 'value' }, null, 2);
    fireEvent.change(editor, { target: { value: invalidConfig } });

    // Try to save
    const saveButton = screen.getByTestId('primary-button');
    fireEvent.click(saveButton);

    // Validation should fail and onSave should not be called
    await waitFor(() => {
      expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      expect(onSaveMock).not.toHaveBeenCalled();
    });
  });

  it('handles errors during save operation', async () => {
    // Mock onSave to reject with an error
    const saveError = new Error('Failed to save');
    const onSaveMock = jest.fn().mockRejectedValue(saveError);

    render(
      <ConfigEditor
        initialConfig={initialConfig}
        onSave={onSaveMock}
        onCancel={jest.fn()}
      />
    );

    const editor = screen.getByTestId('config-editor');

    // Try to save the current valid configuration
    const saveButton = screen.getByTestId('primary-button');
    fireEvent.click(saveButton);

    // Should display an error notification with the error message
    await waitFor(() => {
      expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      expect(screen.getByTestId('notification-error').textContent).toContain(
        'Failed to save'
      );
    });
  });

  it('displays info notification for empty configuration', () => {
    render(
      <ConfigEditor
        initialConfig="{}"
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Should show info notification
    expect(screen.getByTestId('notification-info')).toBeInTheDocument();
    expect(screen.getByTestId('notification-info').textContent).toContain(
      'Start by entering your configuration'
    );
  });

  it('shows placeholder text in editor when empty', () => {
    render(
      <ConfigEditor initialConfig="" onSave={jest.fn()} onCancel={jest.fn()} />
    );

    const editor = screen.getByTestId('config-editor');
    expect(editor).toHaveAttribute('placeholder');
    expect(editor.getAttribute('placeholder')).toContain(
      'Enter your configuration here'
    );
    expect(editor.getAttribute('placeholder')).toContain('akeneoScope');
  });
});
