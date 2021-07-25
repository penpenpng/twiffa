import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";

import {
  getSessionRecordByRequestToken,
  updateSessionRecord,
} from "../lib/firestore";
import { getAccessTokens } from "../lib/twitter";

const page: FunctionComponent = () => {
  return <div />;
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const requestToken = query.oauth_token as string;
  const tokenVerifier = query.oauth_verifier as string;
  const unverifiedSessionRecord = await getSessionRecordByRequestToken(
    requestToken
  );

  // If accessed by user or request token has been expired:
  if (!requestToken || !tokenVerifier || !unverifiedSessionRecord) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }

  const accessTokens = await getAccessTokens(
    {
      oauthToken: unverifiedSessionRecord.requestToken,
      oauthTokenSecret: unverifiedSessionRecord.requestTokenSecret,
    },
    requestToken,
    tokenVerifier
  );

  await updateSessionRecord(unverifiedSessionRecord.sessionId, accessTokens);

  return {
    redirect: {
      permanent: false,
      destination: "/?authorized=true",
    },
  };
};

export default page;
