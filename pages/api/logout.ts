import { deleteSessionRecord } from "../../lib/firestore";
import { apiRouteWithSession } from "../../lib/session";
import { error, isTwiffaError } from "../../lib/error";

const handler = apiRouteWithSession(async (sessionId, req, res) => {
  try {
    await deleteSessionRecord(sessionId);

    res.status(200).json({
      ok: true,
    });
  } catch (e) {
    const thrown =
      isTwiffaError(e) && e.errorLayer === "public"
        ? e
        : error("UNHANDLED_ERROR", e);

    res.status(500).json({
      error: true,
      type: thrown.type,
      description: thrown.description,
    });
  }
});

export default handler;
