import CustomError from '../errors/custom.error';
import { readConfiguration } from './config.utils';
import * as validatorHelper from '../validators/helpers.validators';

// Mock process.env properties
const mockEnv = {
  CTP_CLIENT_ID: 'mockClientId',
  CTP_CLIENT_SECRET: 'mockClientSecret',
  CTP_PROJECT_KEY: 'mockProjectKey',
  CTP_SCOPE: 'mockScope',
  CTP_REGION: 'mockRegion',
};

describe('readConfiguration', () => {
  it('should return the correct configuration when env variables are valid', () => {
    process.env = mockEnv
    const expectedConfig = {
      clientId: 'mockClientId',
      clientSecret: 'mockClientSecret',
      projectKey: 'mockProjectKey',
      scope: 'mockScope',
      region: 'mockRegion',
    };

    // Mock the validation function to return an empty array (no errors)
    jest.spyOn(validatorHelper, 'getValidateMessages').mockReturnValue([]);

    const config = readConfiguration();
    expect(config).toEqual(expectedConfig);
  });

  it('should throw a CustomError when env variables are invalid', () => {
    process.env = mockEnv
    // Mock the validation function to return validation errors
    jest
      .spyOn(validatorHelper, 'getValidateMessages')
      .mockReturnValue(['Invalid variable: CTP_CLIENT_ID']);

    expect(() => {
      readConfiguration();
    }).toThrowError(CustomError);
  });
});