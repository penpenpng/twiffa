import { FunctionComponent } from "react";

export const component: FunctionComponent = () => {
  return (
    <main className="w-screen flex flex-col items-center">
      <p className="font-sans">
        Twiffa はあなたの Twitter アカウントのフォロー/フォロワーの一覧を CSV
        形式で出力します。
      </p>
      <button className="mt-4">出力する</button>
    </main>
  );
};

export default component;
