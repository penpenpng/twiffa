import { apiRouteWithSession } from "../../lib/session";
import { verifySessionRecord } from "../../lib/twitter";

const handler = apiRouteWithSession(async (sessionId, req, res) => {
  res.status(200).json(await verifySessionRecord(sessionId, undefined));
});

export default handler;
