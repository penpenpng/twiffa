import { updateSessionRecord } from "../../lib/firestore";
import { apiRouteWithSession } from "../../lib/session";
import { getRedirectURL, getRequestTokens } from "../../lib/twitter";

const handler = apiRouteWithSession(async (sessionId, req, res) => {
  if (process.env.APP_ENV === "local") {
    await updateSessionRecord(sessionId, {
      accessToken: process.env.OAUTH_ACCESS_TOKEN,
      accessTokenSecret: process.env.OAUTH_ACCESS_SECRET,
    });

    res.status(200).json({
      redirect: false,
    });
  } else {
    try {
      const tokens = await getRequestTokens();

      await updateSessionRecord(sessionId, tokens);

      res.status(200).json({
        authUrl: getRedirectURL(tokens.requestToken),
      });
    } catch (e) {
      if (e.error === "UNKNOWN_TWITTER_ERROR") {
        res.status(500).json({ error: "UNKNOWN_TWITTER_ERROR" });
      } else {
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
      }
    }
  }
});

export default handler;
