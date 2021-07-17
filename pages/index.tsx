import { GetServerSideProps } from "next";
import { Session } from "next-iron-session";
import { FunctionComponent } from "react";
import { v4 as uuid } from "uuid";
import {
  getCredentials,
  createEmptyCredentials,
  updateCredentials,
} from "../lib/dbmock";

import { withSession } from "../lib/session";
import { createAxios, getRedirectURL, getRequestTokens } from "../lib/twitter";

interface Props {
  message: string;
}

const getSessionId = (session: Session): string => {
  const SESSION_ID_KEY = "SESSION_ID";

  if (!session.get(SESSION_ID_KEY)) {
    session.set(SESSION_ID_KEY, uuid());
  }

  const id = session.get(SESSION_ID_KEY);

  console.log("get session ID:", id);

  return id;
};

const page: FunctionComponent<Props> = ({ message }) => {
  return <h1>Hello World: {message}</h1>;
};

// XXX: よく考えたら iron-session じゃなくて nookie で十分感ある
export const getServerSideProps = withSession<Props>(async ({ req }) => {
  const sessionId = getSessionId(req.session);
  const credentials =
    getCredentials(sessionId) || createEmptyCredentials(sessionId);

  if (credentials.accessToken && credentials.accessTokenSecret) {
    // TODO: (アクセストークンが期限切れの可能性があるので本当は ok じゃない)
    // アクセストークンの有効性を確認してダメだったら credentials から各種トークンを削除する
    return {
      props: { message: "ok!" },
    };
  }

  if (!credentials.requestToken || !credentials.requestTokenSecret) {
    const axios = createAxios();

    const tokens = await getRequestTokens(axios);

    updateCredentials(sessionId, tokens);

    return {
      redirect: {
        permanent: false,
        destination: getRedirectURL(tokens.requestToken),
      },
    };
  }

  return {
    redirect: {
      permanent: false,
      destination: getRedirectURL(credentials.requestToken),
    },
  };
});

export default page;
