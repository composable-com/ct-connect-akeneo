import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CollapsedView from './collapsed-view';

// Mock the SecondaryButton component
jest.mock('@commercetools-uikit/secondary-button', () => {
  return function MockSecondaryButton({ onClick, label }: any) {
    return (
      <button data-testid="secondary-button" onClick={onClick}>
        {label}
      </button>
    );
  };
});

describe('CollapsedView', () => {
  it('renders a secondary button with correct label', () => {
    const mockOnEdit = jest.fn();
    render(<CollapsedView onEdit={mockOnEdit} />);

    const button = screen.getByTestId('secondary-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Edit Configuration');
  });

  it('calls onEdit when the button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<CollapsedView onEdit={mockOnEdit} />);

    const button = screen.getByTestId('secondary-button');
    fireEvent.click(button);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });
});
