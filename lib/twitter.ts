import axios, { AxiosResponse } from "axios";
import addOAuthInterceptor from "axios-oauth-1.0a";

import { error } from "./error";

const createAxios = (tokens?: OAuthTokens) => {
  const _axios = axios.create({
    baseURL: "https://api.twitter.com/",
    validateStatus: () => true,
  });

  addOAuthInterceptor(_axios, {
    algorithm: "HMAC-SHA1",
    key: process.env.OAUTH_CONSUMER_KEY,
    secret: process.env.OAUTH_CONSUMER_SECRET,
    token: tokens?.oauthToken,
    tokenSecret: tokens?.oauthTokenSecret,
  });

  return _axios;
};

export const getRequestTokens = async (): Promise<{
  requestToken: string;
  requestTokenSecret: string;
}> => {
  const res = await createAxios().post("/oauth/request_token");

  if (res.status === 429) {
    throw error("API_LIMIT");
  }

  const data = res.data;

  const tokens = Object.fromEntries(
    data.split("&").map((record) => record.split("="))
  );

  if (tokens.oauth_callback_confirmed !== "true") {
    throw error("TWITTER_ERROR");
  }

  const requestToken = tokens.oauth_token;
  const requestTokenSecret = tokens.oauth_token_secret;

  if (typeof requestToken !== "string") {
    throw error("TWITTER_ERROR");
  }

  if (typeof requestTokenSecret !== "string") {
    throw error("TWITTER_ERROR");
  }

  return {
    requestToken,
    requestTokenSecret,
  };
};

export const getAccessTokens = async (
  tokens: OAuthTokens,
  requestToken: string,
  tokenVerifier: string
): Promise<{ accessToken: string; accessTokenSecret: string }> => {
  const res = await createAxios(tokens).post("/oauth/access_token", undefined, {
    params: {
      oauth_token: requestToken,
      oauth_verifier: tokenVerifier,
    },
  });

  if (res.status === 429) {
    throw error("API_LIMIT");
  }

  const data = res.data;

  const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret } =
    Object.fromEntries(data.split("&").map((record) => record.split("=")));

  if (typeof accessToken !== "string") {
    throw error("TWITTER_ERROR");
  }

  if (typeof accessTokenSecret !== "string") {
    throw error("TWITTER_ERROR");
  }

  return {
    accessToken,
    accessTokenSecret,
  };
};

export const getRedirectURL = (requestToken: string): string =>
  `https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`;

/** https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials */
export const verifyCredentials = (
  tokens: OAuthTokens
): Promise<AxiosResponse<GetAccountResponse>> =>
  createAxios(tokens).get<GetAccountResponse>(
    "/1.1/account/verify_credentials.json",
    {
      params: {
        include_email: false,
      },
    }
  );

/** https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers */
export const getFollowers = (
  tokens: OAuthTokens,
  { id, pageToken }: GetUsersRequest
): Promise<AxiosResponse<GetUsersResponse>> =>
  createAxios(tokens).get<GetUsersResponse>(
    `https://api.twitter.com/2/users/${id}/followers`,
    {
      params: {
        max_results: 1000,
        ...(pageToken ? { pagination_token: pageToken } : {}),
      },
    }
  );

/** https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following */
export const getFollowing = (
  tokens: OAuthTokens,
  { id, pageToken }: GetUsersRequest
): Promise<AxiosResponse<GetUsersResponse>> =>
  createAxios(tokens).get<GetUsersResponse>(
    `https://api.twitter.com/2/users/${id}/following`,
    {
      params: {
        max_results: 1000,
        ...(pageToken ? { pagination_token: pageToken } : {}),
      },
    }
  );
