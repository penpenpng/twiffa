import axios, { AxiosInstance } from "axios";
import addOAuthInterceptor from "axios-oauth-1.0a";

interface OAuthTokens {
  oauthToken?: string;
  oauthTokenSecret?: string;
}

export const createAxios = (tokens: OAuthTokens = {}) => {
  const _axios = axios.create({
    baseURL: "https://api.twitter.com/",
    validateStatus: () => true,
  });

  addOAuthInterceptor(_axios, {
    algorithm: "HMAC-SHA1",
    key: process.env.OAUTH_CONSUMER_KEY,
    secret: process.env.OAUTH_CONSUMER_SECRET,
    token: tokens.oauthToken,
    tokenSecret: tokens.oauthTokenSecret,
  });

  return _axios;
};

export const getRequestTokens = async (
  axios: AxiosInstance
): Promise<Partial<Credentials>> => {
  const res = await axios.post("/oauth/request_token");

  if (res.status !== 200) {
    throw "Non-200 response";
  }

  const tokens = Object.fromEntries(
    res.data.split("&").map((credentials) => credentials.split("="))
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
  axios: AxiosInstance,
  requestToken: string,
  tokenVerifier: string
): Promise<Partial<Credentials>> => {
  const res = await axios.post("/oauth/access_token", undefined, {
    params: {
      oauth_token: requestToken,
      oauth_verifier: tokenVerifier,
    },
  });

  if (res.status !== 200) {
    throw "Non-200 response";
  }

  const tokens = Object.fromEntries(
    res.data.split("&").map((credentials) => credentials.split("="))
  );

  const accessToken = tokens.oauth_token;
  const accessTokenSecret = tokens.oauth_token_secret;

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
