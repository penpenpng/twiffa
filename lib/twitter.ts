import axios, { AxiosResponse } from "axios";
import addOAuthInterceptor from "axios-oauth-1.0a";

import { getSessionRecord } from "../lib/firestore";

interface OAuthTokens {
  oauthToken: string;
  oauthTokenSecret: string;
}

type TwitterAPICall<Args, Response> = (
  tokens: OAuthTokens,
  args: Args
) => Promise<AxiosResponse<Response>>;

type TwitterAPIError =
  | "NO_ACCESS_TOKEN"
  | "INVALID_ACCESS_TOKEN"
  | "API_LIMIT"
  | "UNKNOWN_TWITTER_ERROR";

const throwTwitterAPIError = (error: TwitterAPIError): never => {
  throw {
    error,
  };
};

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

const usingStoredToken =
  <Args, Response>(call: TwitterAPICall<Args, Response>) =>
  async (sessionId: string, args: Args) => {
    const record = await getSessionRecord(sessionId);

    const hasAccessTokens = (c) => c.accessToken && c.accessTokenSecret;

    if (!hasAccessTokens(record)) {
      throwTwitterAPIError("NO_ACCESS_TOKEN");
    }

    const res = await call(
      {
        oauthToken: record.accessToken,
        oauthTokenSecret: record.accessTokenSecret,
      },
      args
    );

    if (res.status === 429) {
      throwTwitterAPIError("API_LIMIT");
    }

    if (res.status === 401) {
      throwTwitterAPIError("INVALID_ACCESS_TOKEN");
    }

    if (res.status !== 200 || (res.data as any).errors) {
      throwTwitterAPIError("UNKNOWN_TWITTER_ERROR");
    }

    return res.data;
  };

export const getRequestTokens = async (): Promise<{
  requestToken: string;
  requestTokenSecret: string;
}> => {
  // TODO: API LIMIT をチェックする (現状は internal server error 扱いになるはず)
  const { data } = await createAxios().post("/oauth/request_token");

  const tokens = Object.fromEntries(
    data.split("&").map((record) => record.split("="))
  );

  if (tokens.oauth_callback_confirmed !== "true") {
    throwTwitterAPIError("UNKNOWN_TWITTER_ERROR");
  }

  const requestToken = tokens.oauth_token;
  const requestTokenSecret = tokens.oauth_token_secret;

  if (typeof requestToken !== "string") {
    throwTwitterAPIError("UNKNOWN_TWITTER_ERROR");
  }

  if (typeof requestTokenSecret !== "string") {
    throwTwitterAPIError("UNKNOWN_TWITTER_ERROR");
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
  // TODO: API LIMIT をチェックする (現状は internal server error 扱いになるはず)
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
    throwTwitterAPIError("UNKNOWN_TWITTER_ERROR");
  }

  if (typeof accessTokenSecret !== "string") {
    throwTwitterAPIError("UNKNOWN_TWITTER_ERROR");
  }

  return {
    accessToken,
    accessTokenSecret,
  };
};

export const getRedirectURL = (requestToken: string): string =>
  `https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`;

/** https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials */
const verifyCredentials = usingStoredToken<undefined, GetAccountResponse>(
  (tokens) =>
    createAxios(tokens).get<GetAccountResponse>(
      "/1.1/account/verify_credentials.json",
      {
        params: {
          include_email: false,
        },
      }
    )
);

/** https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers */
const getFollowers = usingStoredToken<GetUsersRequest, GetUsersResponse>(
  (tokens, { id, pageToken }) =>
    createAxios(tokens).get<GetUsersResponse>(
      `https://api.twitter.com/2/users/${id}/followers`,
      {
        params: {
          max_results: 1000,
          ...(pageToken ? { pagination_token: pageToken } : {}),
        },
      }
    )
);

/** https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following */
const getFollowing = usingStoredToken<GetUsersRequest, GetUsersResponse>(
  (tokens, { id, pageToken }) =>
    createAxios(tokens).get<GetUsersResponse>(
      `https://api.twitter.com/2/users/${id}/following`,
      {
        params: {
          max_results: 1000,
          ...(pageToken ? { pagination_token: pageToken } : {}),
        },
      }
    )
);

export const twiffa = async (sessionId: string): Promise<TwiffaResult> => {
  const fetchAllPages = async (
    fetch: (
      sessionId: string,
      args: GetUsersRequest
    ) => Promise<GetUsersResponse>,
    sessionId: string,
    args: { id: string }
  ): Promise<TwitterUser[]> => {
    const result: TwitterUser[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const { data, meta } = await fetch(sessionId, { ...args, pageToken });

      pageToken = meta.next_token;
      result.push(...data);
    } while (pageToken);

    return result;
  };

  try {
    const { id_str: id, name } = await verifyCredentials(sessionId, undefined);
    const following = await fetchAllPages(getFollowing, sessionId, {
      id,
    });
    const followers = await fetchAllPages(getFollowers, sessionId, {
      id,
    });

    return {
      name,
      following,
      followers,
    };
  } catch (e) {
    const getError = (): TwiffaError => {
      if (!e.error) {
        return "INTERNAL_SERVER_ERROR";
      }

      if (["NO_ACCESS_TOKEN", "INVALID_ACCESS_TOKEN"].includes(e.error)) {
        return "NO_CREDENTIAL";
      }

      if (e.error === "API_LIMIT") {
        return "API_LIMIT";
      }

      return "UNKNOWN_TWITTER_ERROR";
    };

    return {
      name: "",
      following: [],
      followers: [],
      error: getError(),
    };
  }
};
