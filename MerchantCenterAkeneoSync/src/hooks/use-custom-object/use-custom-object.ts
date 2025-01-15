import { useMcQuery } from '@commercetools-frontend/application-shell';

import FetchCustomObjectQuery from './fetch-custom-object.ctp.graphql';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';

export const useCustomObject = ({
  container,
  key,
}: {
  container: string;
  key: string;
}) => {
  const { data, error, loading, refetch } = useMcQuery<any, any>(
    FetchCustomObjectQuery,
    {
      variables: { key, container },
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  return { data, error, loading, refetch };
};
