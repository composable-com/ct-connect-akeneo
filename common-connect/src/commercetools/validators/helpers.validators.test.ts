import { expect, it, describe } from "@jest/globals";

import * as validationHelpers from "./helpers.validators";

const stringValidator = [
  validationHelpers.standardString(
    ["clientId"],
    {
      code: "InValidClientId",
      message: "Client id should be 24 characters.",
      referencedBy: "environmentVariables",
    },
    { min: 24, max: 24 }
  ),
];

const keyValidator = [
  validationHelpers.standardKey(["projectKey"], {
    code: "InvalidProjectKey",
    message: "Project key should be a valid string.",
    referencedBy: "environmentVariables",
  }),
];

const regionValidator = [
  validationHelpers.region(["region"], {
    code: "InvalidRegion",
    message: "Not a valid region.",
    referencedBy: "environmentVariables",
  }),
];

const urlValidator = [
  validationHelpers.standardUrl(["url"], {
    code: "InvalidUrl",
    message: "Not a valid url.",
    referencedBy: "environmentVariables",
  }),
];

const scopeValidator = [
  validationHelpers.optional(validationHelpers.standardString)(
    ["url"],
    {
      code: "InvalidScope",
      message: "Scope should be at least 2 characters long.",
      referencedBy: "environmentVariables",
    },
    { min: 2, max: undefined }
  ),
];

describe("Validation Helpers", () => {
  describe("standardString", () => {
    it("should validate a standard string", () => {
      const envVars = { clientId: "mockClientIdgki76kjhgkur" };

      const validationErrors = validationHelpers.getValidateMessages(
        stringValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });

    it("should validate a valid region", () => {
      const envVars = { region: "us-central1.gcp" };

      const validationErrors = validationHelpers.getValidateMessages(
        regionValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });

    it("should fail on an invalid region", () => {
      const envVars = { region: "us-central1.gcp-invalid" };

      const validationErrors = validationHelpers.getValidateMessages(
        regionValidator,
        envVars
      );

      expect(validationErrors.length).toBe(1);
    });

    it("should fail on an invalid url", () => {
      const envVars = { url: "http:/invalid-url.com" };

      const validationErrors = validationHelpers.getValidateMessages(
        urlValidator,
        envVars
      );

      expect(validationErrors.length).toBe(1);
    });

    it("should succeed on undefined scope", () => {
      const envVars = {};

      const validationErrors = validationHelpers.getValidateMessages(
        scopeValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });

    it("should validate a key", () => {
      const envVars = { projectKey: "mock-project-key" };

      const validationErrors = validationHelpers.getValidateMessages(
        keyValidator,
        envVars
      );

      expect(validationErrors.length).toBe(0);
    });
  });
});
