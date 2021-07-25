import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";

import {
  getCredentialsByRequestToken,
  updateCredentials,
} from "../lib/firestore";
import { getAccessTokens } from "../lib/twitter";

const page: FunctionComponent = () => {
  return <div />;
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const requestToken = query.oauth_token as string;
  const tokenVerifier = query.oauth_verifier as string;
  const unverifiedCredentials = await getCredentialsByRequestToken(
    requestToken
  );

  // If accessed by user or request token has been expired:
  if (!requestToken || !tokenVerifier || !unverifiedCredentials) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }

  const accessTokens = await getAccessTokens(
    {
      oauthToken: unverifiedCredentials.requestToken,
      oauthTokenSecret: unverifiedCredentials.requestTokenSecret,
    },
    requestToken,
    tokenVerifier
  );

  await updateCredentials(unverifiedCredentials.sessionId, accessTokens);

  return {
    redirect: {
      permanent: false,
      destination: "/?authorized=true",
    },
  };
};

export default page;
