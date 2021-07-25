import { GetServerSideProps, NextApiHandler } from "next";
import { withIronSession, Session } from "next-iron-session";
import { v4 as uuid } from "uuid";

const getSessionId = async (session: Session): Promise<string> => {
  const SESSION_ID_KEY = "SESSION_ID";

  if (!session.get(SESSION_ID_KEY)) {
    session.set(SESSION_ID_KEY, uuid());
    await session.save();
  }

  const sessionId = session.get(SESSION_ID_KEY);

  console.log("session id:", sessionId);

  return sessionId;
};

const IRON_SESSION_OPTIONS = {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: "twiffa",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export const getServerPropsWithSession = <T = any>(
  handler: (
    sessionId: string,
    context: Parameters<GetServerSideProps<T>>
  ) => ReturnType<GetServerSideProps<T>>
): GetServerSideProps<T> =>
  withIronSession(
    async (context) =>
      handler(await getSessionId(context.req.session), context),
    IRON_SESSION_OPTIONS
  );

export const apiRouteWithSession = <T = any>(
  handler: (
    sessionId: string,
    ...args: Parameters<NextApiHandler<T>>
  ) => ReturnType<NextApiHandler<T>>
): NextApiHandler<T> =>
  withIronSession(
    async (req, res) => handler(await getSessionId(req.session), req, res),
    IRON_SESSION_OPTIONS
  );
