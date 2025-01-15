// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import validator from 'validator';
import { ValidatorCreator, Wrapper } from '../types/index.types';

/**
 * File used to create helpers to validate the fields
 */

const required: Wrapper =
  (fn) =>
  (value, ...args) =>
    !(value === undefined || value === null) && fn(...[String(value), ...args]);

export const standardString: ValidatorCreator = (
  path,
  message,
  overrideConfig = {}
) => [
  path,
  [
    [
      required(validator.isLength),
      message,
      [{ min: 2, max: 20, ...overrideConfig }],
    ],
  ],
];

export const standardKey = (path, message) => [
  path,
  [
    [
      required(
        (value) =>
          validator.isLength(String(value), { min: 2 }) &&
          /^[a-zA-Z0-9-_]+$/.test(value)
      ),

      message,
    ],
  ],
];

export const getValidateMessages = (validatorConfigs, item) =>
  validatorConfigs.flatMap(([path, validators]) => {
    return validators.reduce((acc, [validatorFn, message, args = []]) => {
      const valueToValidate = path.reduce((val, property) => {
        return val[property];
      }, item);
      if (!validatorFn(...[valueToValidate, ...args])) {
        return acc.concat(message);
      }
      return acc;
    }, []);
  });

export const optional =
  (fn) =>
  (...args) => {
    const [path, validators] = fn(...args);
    return [
      path,
      validators.map(([fn, message, validatorArgs]) => [
        (value, ...args) =>
          value === undefined ? true : fn(...[value, ...args]),
        message,
        validatorArgs,
      ]),
    ];
  };

export const array =
  (fn) =>
  (...args) => {
    const [path, validators] = fn(...args);
    return [
      path,
      validators.map(([fn, message, validatorArgs]) => [
        (value, ...args) =>
          Array.isArray(value) &&
          value.every((value) => fn(...[value, ...args])),
        message,
        validatorArgs,
      ]),
    ];
  };

export const region: ValidatorCreator = (path, message) => [
  path,
  [
    [
      required(
        required((value) =>
          validator.isIn(value, [
            'us-central1.gcp',
            'us-east-2.aws',
            'europe-west1.gcp',
            'eu-central-1.aws',
            'australia-southeast1.gcp',
          ])
        )
      ),
      message,
    ],
  ],
];
