import { updateCredentials } from "../../lib/firestore";
import { apiRouteWithSession } from "../../lib/session";
import { getRedirectURL, getRequestTokens } from "../../lib/twitter";

const handler = apiRouteWithSession(async (sessionId, req, res) => {
  const tokens = await getRequestTokens();

  await updateCredentials(sessionId, tokens);

  res.status(200).json({
    redirect: getRedirectURL(tokens.requestToken),
  });
});

export default handler;
