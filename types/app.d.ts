interface SessionRecord {
  sessionId: string;
  requestToken?: string;
  requestTokenSecret?: string;
  requestTokenVerifier?: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

interface TwiffaResult {
  name: string;
  error?: TwiffaError;
  following: TwitterUser[];
  followers: TwitterUser[];
}

type TwiffaError =
  | "NO_CREDENTIAL"
  | "API_LIMIT"
  | "UNKNOWN_TWITTER_ERROR"
  | "INTERNAL_SERVER_ERROR";
