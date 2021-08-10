import { error, isTwiffaError } from "../../lib/error";
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
      const thrown =
        isTwiffaError(e) && e.errorLayer === "public"
          ? e
          : error("UNHANDLED_ERROR");

      res.status(500).json({
        type: thrown.type,
        description: thrown.description,
      });
    }
  }
});

export default handler;
