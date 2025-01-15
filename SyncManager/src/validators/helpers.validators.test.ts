import { expect, it, describe } from '@jest/globals';

import * as validationHelpers from './helpers.validators';

const stringValidator = [
  validationHelpers.standardString(
    ['clientId'],
    {
      code: 'InValidClientId',
      message: 'Client id should be 24 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 24, max: 24 }
  ),
];

const keyValidator = [
  validationHelpers.standardKey(['projectKey'], {
    code: 'InvalidProjectKey',
    message: 'Project key should be a valid string.',
    referencedBy: 'environmentVariables',
  }),
];

const regionValidator = [
  validationHelpers.region(['region'], {
    code: 'InvalidRegion',
    message: 'Not a valid region.',
    referencedBy: 'environmentVariables',
  }),
];

const scopeValidator = [
  validationHelpers.optional(validationHelpers.standardString)(
    ['url'],
    {
      code: 'InvalidScope',
      message: 'Scope should be at least 2 characters long.',
      referencedBy: 'environmentVariables',
    },
    { min: 2, max: undefined }
  ),
];

describe('Validation Helpers', () => {
  describe('standardString', () => {
    it('should validate a standard string', () => {
      const envVars = { clientId: 'mockClientIdgki76kjhgkur' };

      const validationErrors = validationHelpers.getValidateMessages(
        stringValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });

    it('should validate a valid region', () => {
      const envVars = { region: 'us-central1.gcp' };

      const validationErrors = validationHelpers.getValidateMessages(
        regionValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });

    it('should fail on an invalid region', () => {
      const envVars = { region: 'us-central1.gcp-invalid' };

      const validationErrors = validationHelpers.getValidateMessages(
        regionValidator,
        envVars
      );

      expect(validationErrors.length).toBe(1);
    });

    it('should succeed on undefined scope', () => {
      const envVars = {};

      const validationErrors = validationHelpers.getValidateMessages(
        scopeValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });

    it('should validate a key', () => {
      const envVars = { projectKey: 'mock-project-key' };

      const validationErrors = validationHelpers.getValidateMessages(
        keyValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });
  });

  describe('array validator', () => {
    const baseStringValidator = (path: any, message: any) => [
      path,
      [[(value: any) => typeof value === 'string', message]],
    ];

    const arrayStringValidator = validationHelpers.array(baseStringValidator);
    const [path, validators] = arrayStringValidator(['testArray'], {
      code: 'InvalidArray',
      message: 'Array should contain only strings',
      referencedBy: 'test',
    });

    const validateValue = (
      value: string | (string | number)[] | (string | null | undefined)[]
    ) => {
      return !validationHelpers.getValidateMessages([[path, validators]], {
        testArray: value,
      }).length;
    };

    it('should return true for an empty array', () => {
      expect(validateValue([])).toBe(true);
    });

    it('should return true for an array with all valid elements', () => {
      expect(validateValue(['a', 'b', 'c'])).toBe(true);
    });

    it('should return false for an array with at least one invalid element', () => {
      expect(validateValue(['a', 1, 'c'])).toBe(false);
    });

    it('should return false for non-array input', () => {
      expect(validateValue('not an array')).toBe(false);
    });

    it('should handle arrays with null or undefined gracefully', () => {
      expect(validateValue([null, undefined, 'a'])).toBe(false);
    });
  });
});
