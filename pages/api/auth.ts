import { NextApiHandler } from "next";
import {
  getCredentialsByRequestToken,
  updateCredentials,
} from "../../lib/dbmock";
import { createAxios, getAccessTokens } from "../../lib/twitter";

const handler: NextApiHandler = async (req, res) => {
  const requestToken = req.query.oauth_token;
  const tokenVerifier = req.query.oauth_verifier;

  if (typeof requestToken !== "string") {
    res.status(500).json({
      error: "Twitter auth server doesn't provide request token.",
    });

    return;
  }

  if (typeof tokenVerifier !== "string") {
    res.status(500).json({
      error: "Twitter auth server doesn't provide request token verifier.",
    });

    return;
  }

  const credentials = getCredentialsByRequestToken(requestToken);

  if (!credentials) {
    res.status(500).json({
      error: "Request token is expired.",
    });

    return;
  }

  const axios = createAxios({
    oauthToken: credentials.requestToken,
    oauthTokenSecret: credentials.requestTokenSecret,
  });

  const accessTokens = await getAccessTokens(
    axios,
    requestToken,
    tokenVerifier
  );

  updateCredentials(credentials.sessionId, accessTokens);

  res.status(200).json({
    ok: true,
  });

  // TODO: 本当に ok かどうか実際に何か呼んで確かめる
};

export default handler;
