import { GetServerSideProps } from "next";
import { withIronSession, Session } from "next-iron-session";

type GetServerSidePropsWithSession<
  P extends { [key: string]: any } = { [key: string]: any }
> = (
  ctx: Parameters<GetServerSideProps<P>>[0] & {
    req: Parameters<GetServerSideProps<P>>[0]["req"] & { session: Session };
  }
) => ReturnType<GetServerSideProps<P>>;

export const withSession = <P>(handler: GetServerSidePropsWithSession<P>) =>
  withIronSession(handler, {
    password: process.env.SECRET_COOKIE_PASSWORD,
    cookieName: "twiffa",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
  });
