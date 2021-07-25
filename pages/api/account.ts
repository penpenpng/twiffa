import { apiRouteWithSession } from "../../lib/session";
import { verifyCredentials } from "../../lib/twitter";

const handler = apiRouteWithSession(async (sessionId, req, res) => {
  res.status(200).json(await verifyCredentials(sessionId, undefined));
});

export default handler;
