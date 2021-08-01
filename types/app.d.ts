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
  error?: "NO_CREDENTIAL" | "API_LIMIT" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";
  following: TwitterUser[];
  followers: TwitterUser[];
}
