import React from 'react';
import { render, screen } from '@testing-library/react';
import EntryPoint from './entry-point';

// Use direct mocks for the mock functions
jest.mock('@commercetools-frontend/application-shell', () => {
  return {
    ApplicationShell: ({ children }: any) => (
      <div data-testid="application-shell">{children}</div>
    ),
    setupGlobalErrorListener: jest.fn(),
  };
});

// Mock the lazy-loaded routes
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    lazy: jest.fn(() => () => (
      <div data-testid="mocked-routes">Mocked Routes</div>
    )),
  };
});

// Mock loadMessages
jest.mock('../../load-messages', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ en: {} })),
}));

describe('EntryPoint', () => {
  // Mock window.app
  beforeAll(() => {
    // @ts-ignore
    window.app = {
      applicationName: 'test-app',
    };
  });

  afterAll(() => {
    // @ts-ignore
    delete window.app;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the application shell with correct props', () => {
    render(<EntryPoint />);

    // Check that ApplicationShell is rendered
    expect(screen.getByTestId('application-shell')).toBeInTheDocument();

    // Check that the routes are rendered within the shell
    expect(screen.getByTestId('mocked-routes')).toBeInTheDocument();
  });
});
