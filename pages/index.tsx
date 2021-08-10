import { GetServerSideProps } from "next";
import { FunctionComponent, useEffect } from "react";
import axios from "axios";

import {
  getSessionRecordByRequestToken,
  updateSessionRecord,
} from "../lib/firestore";
import { getAccessTokens } from "../lib/twitter";
import { getServerPropsWithSession } from "../lib/session";
import { twiffa } from "../lib/twiffa";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Home from "../components/Home";
import Result from "../components/Result";
import { error, getErrorDescription, isTwiffaError } from "../lib/error";
import { omitUndefinedProps } from "../lib/prop";

interface Props {
  twiffaResult: TwiffaResult;
  carriedError?: TwiffaErrorType;
}

const goAuthPage = async () => {
  // XXX: typing
  const { data } = await axios.get("api/authUrl", {
    validateStatus: () => true,
  });

  if (data.error) {
    alert(`エラー: ${data.description || data.type}`);
  } else if (data.authUrl) {
    window.location.href = data.authUrl;
  } else {
    // Only process.env.APP_ENV === "local"
    window.location.reload();
  }
};

const Page: FunctionComponent<Props> = ({ twiffaResult, carriedError }) => {
  useEffect(() => {
    if (carriedError) {
      alert(`エラー: ${getErrorDescription(carriedError)}`);
    }
  });

  return (
    <div className="h-screen">
      <Header />
      {twiffaResult.error?.type === "VALID_TOKEN_NOT_FOUND" ? (
        <Home goAuthPage={goAuthPage} />
      ) : (
        <Result twiffaResult={twiffaResult} />
      )}
      <Footer />
    </div>
  );
};

const storeAccessToken = async (
  requestToken: string,
  tokenVerifier: string
) => {
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

    await updateSessionRecord(unverifiedSessionRecord.sessionId, accessTokens);
  }
};

export const getServerSideProps: GetServerSideProps<Props> =
  getServerPropsWithSession(async (sessionId, { query }) => {
    // If returned from twitter auth page
    if (query.oauth_token && query.oauth_verifier) {
      try {
        await storeAccessToken(
          query.oauth_token as string,
          query.oauth_verifier as string
        );

        return {
          redirect: {
            destination: "/",
            permanent: false,
          },
        };
      } catch (e) {
        const thrown =
          isTwiffaError(e) && e.errorLayer === "public"
            ? e
            : error("UNHANDLED_ERROR", e);

        return {
          redirect: {
            destination: `/?error=${thrown.type}`,
            permanent: false,
          },
        };
      }
    }

    const props = omitUndefinedProps({
      twiffaResult: await twiffa(sessionId),
      carriedError: query.error as TwiffaErrorType | undefined,
    });

    return {
      props,
    };
  });

export default Page;
