import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';

// Manual mock for the entryPointUriPathToPermissionKeys function
const mockEntryPointUriPathToPermissionKeys = jest.fn(() => ({
  View: 'view-permission',
  Manage: 'manage-permission',
}));

// Mock the external module
jest.mock('@commercetools-frontend/application-shell/ssr', () => ({
  entryPointUriPathToPermissionKeys: mockEntryPointUriPathToPermissionKeys,
}));

describe('constants', () => {
  it('should define PERMISSIONS based on entryPointUriPath', () => {
    // Force module re-import to ensure our mocks are applied
    jest.resetModules();

    // Import the constants module (this will execute the module code with our mocks in place)
    const constants = require('./constants');

    // Verify it calls the permission function
    expect(mockEntryPointUriPathToPermissionKeys).toHaveBeenCalled();

    // Verify PERMISSIONS matches our mock
    expect(constants.PERMISSIONS).toEqual({
      View: 'view-permission',
      Manage: 'manage-permission',
    });
  });
});
