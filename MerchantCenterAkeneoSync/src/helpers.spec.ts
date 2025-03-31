import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  getErrorMessage,
  extractErrorFromGraphQlResponse,
  createGraphQlUpdateActions,
  convertToActionData,
} from './helpers';
import type { TSyncAction } from './types';

describe('helpers', () => {
  describe('getErrorMessage', () => {
    it('should return GraphQL errors messages joined by new line', () => {
      const error = new ApolloError({
        graphQLErrors: [
          new GraphQLError('Error 1'),
          new GraphQLError('Error 2'),
        ],
      });
      expect(getErrorMessage(error)).toBe('Error 1\nError 2');
    });

    it('should return error message if there are no GraphQL errors', () => {
      const error = new ApolloError({
        networkError: new Error('Network error'),
      });
      expect(getErrorMessage(error)).toBe('Network error');
    });
  });

  describe('extractErrorFromGraphQlResponse', () => {
    it('should extract network errors from Apollo error', () => {
      const networkResult = {
        errors: [{ message: 'Network error' }],
      };
      const apolloError = new ApolloError({
        networkError: { result: networkResult } as any,
      });
      const result = extractErrorFromGraphQlResponse(apolloError);
      expect(result).toEqual(networkResult.errors);
    });

    it('should extract GraphQL errors from Apollo error', () => {
      const graphQLErrors = [new GraphQLError('GraphQL error')];
      const apolloError = new ApolloError({
        graphQLErrors,
      });
      const result = extractErrorFromGraphQlResponse(apolloError);
      expect(result).toEqual(graphQLErrors);
    });

    it('should return the original error if not an Apollo error', () => {
      const error = new Error('Regular error');
      const result = extractErrorFromGraphQlResponse(error);
      expect(result).toBe(error);
    });
  });

  describe('createGraphQlUpdateActions', () => {
    it('should convert sync actions to GraphQL update actions', () => {
      const syncActions: TSyncAction[] = [
        { action: 'changeKey', key: 'new-key' },
        { action: 'changeName', name: { en: 'New name' } },
      ];
      const result = createGraphQlUpdateActions(syncActions);
      expect(result).toEqual([
        { changeKey: { key: 'new-key' } },
        { changeName: { name: [{ locale: 'en', value: 'New name' }] } },
      ]);
    });

    it('should return an empty array if no actions are provided', () => {
      const result = createGraphQlUpdateActions([]);
      expect(result).toEqual([]);
    });
  });

  describe('convertToActionData', () => {
    it('should convert channel draft to action data', () => {
      const draft = {
        nameAllLocales: [
          { locale: 'en', value: 'Channel name' },
          { locale: 'de', value: 'Kanal name' },
        ],
        key: 'channel-key',
      };
      const result = convertToActionData(draft);
      expect(result).toEqual({
        key: 'channel-key',
        name: {
          en: 'Channel name',
          de: 'Kanal name',
        },
        nameAllLocales: [
          { locale: 'en', value: 'Channel name' },
          { locale: 'de', value: 'Kanal name' },
        ],
      });
    });
  });
});
