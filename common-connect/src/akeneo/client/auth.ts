import * as dotenv from "dotenv";

import { AuthResponse } from "./types";
import { logger } from "../../commercetools/utils/logger.utils";
dotenv.config();

/**
 * @returns access_token to authenticate with Akeneo API
 */
const getAccessToken = async () => {
  // Read and validate environment variables
  const {
    AKENEO_CLIENT_ID,
    AKENEO_CLIENT_SECRET,
    AKENEO_USERNAME,
    AKENEO_PASSWORD,
    AKENEO_BASE_URL,
  } = process.env;

  if (
    !AKENEO_CLIENT_ID ||
    !AKENEO_CLIENT_SECRET ||
    !AKENEO_USERNAME ||
    !AKENEO_PASSWORD ||
    !AKENEO_BASE_URL
  ) {
    logger.error(
      "Missing Akeneo environment variables. Please check your .env file."
    );
    process.exit(1);
  }

  const authHeader = Buffer.from(
    `${AKENEO_CLIENT_ID}:${AKENEO_CLIENT_SECRET}`
  ).toString("base64");

  const url = `${AKENEO_BASE_URL}/api/oauth/v1/token`;
  const body = {
    grant_type: "password",
    username: AKENEO_USERNAME,
    password: AKENEO_PASSWORD,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Authentication failed: ${errorData.error_description}`);
    }

    const { access_token }: AuthResponse = await response.json();

    return access_token;
  } catch (error) {
    logger.error("Error authenticating:", error);
    process.exit(1);
  }
};

export default getAccessToken;
