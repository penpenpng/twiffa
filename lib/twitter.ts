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

export const verifySessionRecord = usingStoredToken<undefined, any>((tokens) =>
  createAxios(tokens).get<unknown>("/1.1/account/verify_record.json", {
    params: {
      include_email: false,
    },
  })
);

export const getFollowers = usingStoredToken<{ id: string }, any>(
  (tokens, { id }) =>
    createAxios(tokens).get<unknown>(`/2/users/${id}/followers`)
);

export const getFollowing = usingStoredToken<{ id: string }, any>(
  (tokens, { id }) =>
    createAxios(tokens).get<unknown>(`/2/users/${id}/following`)
);
