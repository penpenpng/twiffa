const Errors: Record<
  TwiffaErrorType,
  | {
      errorLayer: "public" | "private";
      description: string;
    }
  | {
      errorLayer: "private";
      description?: string;
    }
> = {
  STARTUP_ERROR: {
    errorLayer: "private",
  },
  LOGIC_ERROR: {
    errorLayer: "private",
  },
  VALID_TOKEN_NOT_FOUND: {
    errorLayer: "private",
  },
  TWITTER_ERROR: {
    errorLayer: "public",
    description:
      "このエラーは Twitter サーバに原因がある可能性があります。しばらくしてからもう一度お試しください。",
  },
  DATABASE_ERROR: {
    errorLayer: "public",
    description:
      "このエラーはデータベースサービスに原因がある可能性があります。しばらくしてからもう一度お試しください。",
  },
  API_LIMIT: {
    errorLayer: "public",
    description:
      "Twitter API の呼び出し回数制限を超過しました。このエラーは短期間に多くのリクエストを送信した場合か、フォロー/フォロワー数が巨大 (おおよそ 15000～) な場合に発生します。",
  },
  UNHANDLED_ERROR: {
    errorLayer: "public",
    description: "不明なエラー。",
  },
};

export const error = (type: TwiffaErrorType, meta?: unknown): TwiffaError => ({
  _twiffaError: true,
  type,
  meta: meta,
  ...Errors[type],
});

export const isTwiffaError = (obj: any): obj is TwiffaError => obj._twiffaError;

export const getErrorDescription = (
  type: TwiffaErrorType
): string | undefined => Errors[type].description;
