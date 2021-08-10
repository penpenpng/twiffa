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
  following: TwitterUser[];
  followers: TwitterUser[];
  error?: TwiffaError;
}

interface OAuthTokens {
  oauthToken: string;
  oauthTokenSecret: string;
}

interface TwiffaError {
  _twiffaError: true;
  type: ErrorType;
  errorLayer: "public" | "private";
  description?: string;
  meta?: unknown;
}

type TwiffaErrorType =
  | "STARTUP_ERROR"
  | "LOGIC_ERROR"
  | "VALID_TOKEN_NOT_FOUND"
  | "TWITTER_ERROR"
  | "DATABASE_ERROR"
  | "API_LIMIT"
  | "UNHANDLED_ERROR";
