import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";

import {
  getSessionRecordByRequestToken,
  updateSessionRecord,
} from "../lib/firestore";
import { getAccessTokens, twiffa } from "../lib/twitter";
import { getServerPropsWithSession } from "../lib/session";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Home from "../components/Home";
import Result from "../components/Result";

interface Props {
  twiffaResult?: TwiffaResult;
}

const page: FunctionComponent<Props> = ({ twiffaResult }) => {
  if (!twiffaResult) return <div />;

  return (
    <div className="h-screen">
      <Header />
      {twiffaResult.error === "NO_CREDENTIAL" ? (
        <Home goAuthPage={() => console.log("fetch!")} />
      ) : (
        <Result twiffaResult={twiffaResult} />
      )}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<Props> =
  getServerPropsWithSession(async (sessionId, { query }) => {
    // If accessed by twitter auth server
    if (query.oauth_token && query.oauth_verifier) {
      const requestToken = query.oauth_token as string;
      const tokenVerifier = query.oauth_verifier as string;

      const unverifiedSessionRecord = await getSessionRecordByRequestToken(
        requestToken
      );

      if (unverifiedSessionRecord) {
        const accessTokens = await getAccessTokens(
          {
            oauthToken: unverifiedSessionRecord.requestToken,
            oauthTokenSecret: unverifiedSessionRecord.requestTokenSecret,
          },
          requestToken,
          tokenVerifier
        );

        await updateSessionRecord(
          unverifiedSessionRecord.sessionId,
          accessTokens
        );
      }

      return {
        props: {
          twiffaResult: undefined,
        },
      };
    }

    return {
      props: {
        twiffaResult: await twiffa(sessionId),
      },
    };
  });

export default page;
