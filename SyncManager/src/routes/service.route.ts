import { Router } from 'express';
import { logger } from '../utils/logger.utils';
import { post } from '../controllers/service.controller';
import { getJwtFromCookie } from '../utils/config.utils';
import CustomError from '../errors/custom.error';

const serviceRouter = Router();

const checkJwt = async (mcAccessToken: string) => {
  try {
    const response = await fetch(
      `https://mc-api.${process.env.CTP_REGION}.commercetools.com/graphql`,
      {
        headers: {
          Authorization: `Bearer ${mcAccessToken}`,
          'x-graphql-target': 'mc',
        },
        method: 'POST',
        body: JSON.stringify({
          operationName: 'FetchLoggedInUser',
          variables: {},
          query:
            'query FetchLoggedInUser {\n  user: me {\n    id\n    email\n    createdAt\n    gravatarHash\n    firstName\n    lastName\n    language\n    numberFormat\n    timeZone\n    launchdarklyTrackingId\n    launchdarklyTrackingGroup\n    launchdarklyTrackingSubgroup\n    launchdarklyTrackingTeam\n    launchdarklyTrackingCloudEnvironment\n    defaultProjectKey\n    businessRole\n    projects {\n      total\n      results {\n        name\n        key\n        suspension {\n          isActive\n          __typename\n        }\n        expiry {\n          isActive\n          __typename\n        }\n        isProductionProject\n        __typename\n      }\n      __typename\n    }\n    idTokenUserInfo {\n      iss\n      sub\n      aud\n      exp\n      iat\n      email\n      name\n      additionalClaims\n      __typename\n    }\n    __typename\n  }\n}',
        }),
      }
    );

    return await response.json();
  } catch (error) {
    throw new CustomError(401, 'Unauthorized');
  }
};

serviceRouter.post('/', async (req, res, next) => {
  logger.info('Service post message received');

  try {
    if (!process.env.DEV_MODE) {
      const mcAccessToken = getJwtFromCookie(req.headers.cookie ?? '');

      if (!mcAccessToken) {
        throw new CustomError(401, 'Unauthorized');
      }

      const user = await checkJwt(mcAccessToken);
      if (!user) {
        throw new CustomError(401, 'Unauthorized');
      }
    }
    const response = await post(req, res);

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default serviceRouter;
