import { renderHook } from '@testing-library/react-hooks';
import { useCustomObject } from './use-custom-object';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';

// Mock the useMcQuery hook
jest.mock('@commercetools-frontend/application-shell', () => ({
  useMcQuery: jest.fn(),
}));

describe('useCustomObject', () => {
  const mockData = {
    customObject: {
      id: 'obj-123',
      key: 'test-key',
      value: { field1: 'value1', field2: 'value2' },
    },
  };

  const mockParams = {
    container: 'test-container',
    key: 'test-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call useMcQuery with correct parameters', () => {
    // Mock the implementation
    (useMcQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      loading: true,
      refetch: jest.fn(),
    });

    // Render the hook
    renderHook(() => useCustomObject(mockParams));

    // Check if useMcQuery was called with the correct params
    expect(useMcQuery).toHaveBeenCalledWith(
      expect.anything(), // GraphQL query
      {
        variables: { key: mockParams.key, container: mockParams.container },
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
      }
    );
  });

  it('should return the data from useMcQuery', () => {
    // Mock the implementation
    const mockRefetch = jest.fn();
    (useMcQuery as jest.Mock).mockReturnValue({
      data: mockData,
      error: null,
      loading: false,
      refetch: mockRefetch,
    });

    // Render the hook
    const { result } = renderHook(() => useCustomObject(mockParams));

    // Check the returned values
    expect(result.current).toEqual({
      data: mockData,
      error: null,
      loading: false,
      refetch: mockRefetch,
    });
  });

  it('should return error when query fails', () => {
    // Mock the implementation with error
    const mockError = new Error('Failed to fetch custom object');
    const mockRefetch = jest.fn();
    (useMcQuery as jest.Mock).mockReturnValue({
      data: null,
      error: mockError,
      loading: false,
      refetch: mockRefetch,
    });

    // Render the hook
    const { result } = renderHook(() => useCustomObject(mockParams));

    // Check the returned values
    expect(result.current).toEqual({
      data: null,
      error: mockError,
      loading: false,
      refetch: mockRefetch,
    });
  });

  it('should return loading state', () => {
    // Mock the implementation with loading state
    const mockRefetch = jest.fn();
    (useMcQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      loading: true,
      refetch: mockRefetch,
    });

    // Render the hook
    const { result } = renderHook(() => useCustomObject(mockParams));

    // Check the returned values
    expect(result.current).toEqual({
      data: null,
      error: null,
      loading: true,
      refetch: mockRefetch,
    });
  });
});
