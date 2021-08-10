import { AxiosResponse } from "axios";

import { getSessionRecord } from "../lib/firestore";
import { getFollowers, getFollowing, verifyCredentials } from "./twitter";
import { error, isTwiffaError } from "./error";

type TwitterAPICall<Args, Response> = (
  tokens: OAuthTokens,
  args: Args
) => Promise<AxiosResponse<Response>>;

const usingStoredToken =
  <Args, Response>(call: TwitterAPICall<Args, Response>) =>
  async (sessionId: string, args: Args): Promise<Response> => {
    const record = await getSessionRecord(sessionId);

    const hasAccessTokens = (c) => c.accessToken && c.accessTokenSecret;

    if (!hasAccessTokens(record)) {
      throw error("VALID_TOKEN_NOT_FOUND");
    }

    const res = await call(
      {
        oauthToken: record.accessToken,
        oauthTokenSecret: record.accessTokenSecret,
      },
      args
    );

    if (res.status === 429) {
      throw error("API_LIMIT");
    }

    if (res.status === 401) {
      throw error("VALID_TOKEN_NOT_FOUND");
    }

    if (res.status !== 200 || (res.data as any).errors) {
      throw error("TWITTER_ERROR");
    }

    return res.data;
  };

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
    const { id_str: id, name } = await usingStoredToken(verifyCredentials)(
      sessionId,
      undefined
    );

    const following = await fetchAllPages(
      usingStoredToken(getFollowing),
      sessionId,
      {
        id,
      }
    );
    const followers = await fetchAllPages(
      usingStoredToken(getFollowers),
      sessionId,
      {
        id,
      }
    );

    return {
      name,
      following,
      followers,
    };
  } catch (e) {
    return {
      name: "",
      following: [],
      followers: [],
      error: isTwiffaError(e) ? e : error("UNHANDLED_ERROR", e),
    };
  }
};
