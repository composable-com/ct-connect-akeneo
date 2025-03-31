import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfigEditorContainer from './config-editor-container';

// Mock child components
jest.mock('./config-editor', () => {
  return function MockConfigEditor({ initialConfig, onSave, onCancel }: any) {
    return (
      <div data-testid="config-editor" data-initial-config={initialConfig}>
        <button
          data-testid="save-button"
          onClick={() => onSave('{"updated": true}')}
        >
          Save
        </button>
        <button data-testid="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  };
});

jest.mock('./collapsed-view', () => {
  return function MockCollapsedView({ onEdit }: any) {
    return (
      <button data-testid="edit-button" onClick={onEdit}>
        Edit Configuration
      </button>
    );
  };
});

describe('ConfigEditorContainer', () => {
  const mockProps = {
    onEditingChange: jest.fn(),
    onSave: jest.fn().mockResolvedValue(undefined),
    config: '{"test": "config"}',
    isEditing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CollapsedView when not in editing mode', () => {
    render(<ConfigEditorContainer {...mockProps} />);

    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
  });

  it('renders ConfigEditor when in editing mode', () => {
    render(<ConfigEditorContainer {...mockProps} isEditing={true} />);

    expect(screen.getByTestId('config-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();

    // Check if initialConfig is passed correctly
    const configEditor = screen.getByTestId('config-editor');
    expect(configEditor).toHaveAttribute(
      'data-initial-config',
      '{"test": "config"}'
    );
  });

  it('sets editing to true when CollapsedView edit button is clicked', () => {
    render(<ConfigEditorContainer {...mockProps} />);

    const editButton = screen.getByTestId('edit-button');
    editButton.click();

    expect(mockProps.onEditingChange).toHaveBeenCalledWith(true);
  });

  it('sets editing to false when ConfigEditor cancel button is clicked', () => {
    render(<ConfigEditorContainer {...mockProps} isEditing={true} />);

    const cancelButton = screen.getByTestId('cancel-button');
    cancelButton.click();

    expect(mockProps.onEditingChange).toHaveBeenCalledWith(false);
  });

  it('calls onSave when ConfigEditor save button is clicked', () => {
    render(<ConfigEditorContainer {...mockProps} isEditing={true} />);

    const saveButton = screen.getByTestId('save-button');
    saveButton.click();

    expect(mockProps.onSave).toHaveBeenCalledWith('{"updated": true}');
  });
});
