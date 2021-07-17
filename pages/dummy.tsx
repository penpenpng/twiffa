import { Session } from "next-iron-session";
import { FunctionComponent } from "react";
import { v4 as uuid } from "uuid";

import { withSession } from "../lib/session";

interface Props {
  message: string;
}

// TODO: なんかセッションが機能してなさそうに見えるからこれデプロイして様子見てみる
const getSessionId = (session: Session): string => {
  const SESSION_ID_KEY = "SESSION_ID";

  if (!session.get(SESSION_ID_KEY)) {
    console.log("session ID not found. created.");
    session.set(SESSION_ID_KEY, uuid());
  }

  const id = session.get(SESSION_ID_KEY);

  console.log("get session ID:", id);

  return id;
};

const page: FunctionComponent<Props> = ({ message }) => {
  return <h1>Hello World: {message}</h1>;
};

export const getServerSideProps = withSession<Props>(async ({ req }) => {
  getSessionId(req.session);

  return {
    props: { message: "ok!" },
  };
});

export default page;
