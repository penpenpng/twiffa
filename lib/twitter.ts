import axios, { AxiosResponse } from "axios";
import addOAuthInterceptor from "axios-oauth-1.0a";

import { getSessionRecord } from "../lib/firestore";

export const APIError = {
  NO_ACCESS_TOKEN: "NO_ACCESS_TOKEN",
} as const;

interface OAuthTokens {
  oauthToken: string;
  oauthTokenSecret: string;
}

type TwitterAPICall<Args, Response> = (
  tokens: OAuthTokens,
  args: Args
) => Promise<AxiosResponse<Response>>;

const createAxios = (tokens?: OAuthTokens) => {
  const _axios = axios.create({
    baseURL: "https://api.twitter.com/",
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

const usingStoredToken =
  <Args, Response>(call: TwitterAPICall<Args, Response>) =>
  async (sessionId: string, args: Args) => {
    const record = await getSessionRecord(sessionId);

    const hasAccessTokens = (c) => c.accessToken && c.accessTokenSecret;

    if (!hasAccessTokens(record)) {
      throw {
        error: APIError.NO_ACCESS_TOKEN,
      };
    }

    const res = await call(
      {
        oauthToken: record.accessToken,
        oauthTokenSecret: record.accessTokenSecret,
      },
      args
    );

    // TODO もっとまじめにやる
    // 400 台と rate limit のチェックは最低やる
    if (res.status !== 200) {
      throw {
        error: APIError.NO_ACCESS_TOKEN,
      };
    }

    return res.data;
  };

export const getRequestTokens = async (): Promise<{
  requestToken: string;
  requestTokenSecret: string;
}> => {
  const { data } = await createAxios().post("/oauth/request_token");

  const tokens = Object.fromEntries(
    data.split("&").map((record) => record.split("="))
  );

  if (tokens.oauth_callback_confirmed !== "true") {
    throw "Callback URL is not confirmed.";
  }

  const requestToken = tokens.oauth_token;
  const requestTokenSecret = tokens.oauth_token_secret;

  if (typeof requestToken !== "string") {
    throw "Request token is not provided.";
  }

  if (typeof requestTokenSecret !== "string") {
    throw "Request token secret is not provided.";
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
  const { data } = await createAxios(tokens).post(
    "/oauth/access_token",
    undefined,
    {
      params: {
        oauth_token: requestToken,
        oauth_verifier: tokenVerifier,
      },
    }
  );

  const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret } =
    Object.fromEntries(data.split("&").map((record) => record.split("=")));

  if (typeof accessToken !== "string") {
    throw "Access token is not provided.";
  }

  if (typeof accessTokenSecret !== "string") {
    throw "Access token secret is not provided.";
  }

  return {
    accessToken,
    accessTokenSecret,
  };
};

export const getRedirectURL = (requestToken: string): string =>
  `https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`;

/** https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials */
export const verifyCredentials = usingStoredToken<
  undefined,
  GetAccountResponse
>((tokens) =>
  createAxios(tokens).get<GetAccountResponse>(
    "/1.1/account/verify_record.json",
    {
      params: {
        include_email: false,
      },
    }
  )
);

/** https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers */
export const getFollowers = usingStoredToken<GetUsersRequest, GetUsersResponse>(
  (tokens, { id, pageToken }) =>
    createAxios(tokens).get<GetUsersResponse>(`/2/users/${id}/followers`, {
      params: {
        pagination_token: pageToken,
        max_results: 1000,
      },
    })
);

/** https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following */
export const getFollowing = usingStoredToken<GetUsersRequest, GetUsersResponse>(
  (tokens, { id, pageToken }) =>
    createAxios(tokens).get<GetUsersResponse>(`/2/users/${id}/following`, {
      params: {
        pagination_token: pageToken,
        max_results: 1000,
      },
    })
);
