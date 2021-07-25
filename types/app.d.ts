interface SessionRecord {
  sessionId: string;
  requestToken?: string;
  requestTokenSecret?: string;
  requestTokenVerifier?: string;
  accessToken?: string;
  accessTokenSecret?: string;
}
