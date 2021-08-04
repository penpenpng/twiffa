import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import axios from "axios";

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

  const goAuthPage = async () => {
    const { data } = await axios.get("api/authUrl", {
      validateStatus: () => true,
    });

    if (data.authUrl) {
      window.location.href = data.authUrl;
      return;
    }

    alert(
      `予期しないエラーが発生しました。数分おいてもう一度試しても引き続きエラーが発生する場合は、お手数ですが以下のエラーコードを管理人までお知らせください: ${
        data.error || "UNHANDLED_ERROR"
      }`
    );
  };

  return (
    <div className="h-screen">
      <Header />
      {twiffaResult.error === "NO_CREDENTIAL" ? (
        <Home goAuthPage={goAuthPage} />
      ) : (
        <Result twiffaResult={twiffaResult} />
      )}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<Props> =
  getServerPropsWithSession(async (sessionId, { query }) => {
    // If returned from twitter auth page
    // TODO: Error handling
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
        redirect: {
          destination: "/",
          permanent: false,
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
