import React from 'react';
import { render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import ApplicationRoutes from './routes';

// Mock the sync component
jest.mock('./components/sync', () => () => (
  <div data-testid="sync-component">Sync Component</div>
));

describe('ApplicationRoutes', () => {
  it('should render the Sync component as default route', () => {
    // Create a history object
    const history = createMemoryHistory();

    // Render the component with Router
    render(
      <Router history={history}>
        <ApplicationRoutes />
      </Router>
    );

    // Check that the Sync component is rendered
    expect(screen.getByTestId('sync-component')).toBeInTheDocument();
    expect(screen.getByText('Sync Component')).toBeInTheDocument();
  });

  it('should display the correct component when path is /', () => {
    // Create a history object and push to root path
    const history = createMemoryHistory();
    history.push('/');

    // Render the component with Router
    render(
      <Router history={history}>
        <ApplicationRoutes />
      </Router>
    );

    // Check that the Sync component is rendered for the root path
    expect(screen.getByTestId('sync-component')).toBeInTheDocument();
  });

  it('should have proper displayName', () => {
    expect(ApplicationRoutes.displayName).toBe('ApplicationRoutes');
  });
});
