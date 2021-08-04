import { FunctionComponent } from "react";

interface Prop {
  goAuthPage: () => Promise<void>;
}

export const Component: FunctionComponent<Prop> = ({ goAuthPage }) => {
  return (
    <main className="w-screen flex flex-col items-center">
      <p>
        Twiffa はあなたの Twitter
        アカウントのフォロー/フォロワーの一覧を取得し、CSV 形式で出力します。
        利用には Twitter 認証が必要です。
      </p>
      <button className="mt-4" onClick={goAuthPage}>
        フォロー/フォロワーを取得する
      </button>
    </main>
  );
};

export default Component;
