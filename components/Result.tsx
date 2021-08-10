import { FunctionComponent, useState, useEffect } from "react";
import { stringify } from "csv";
import axios from "axios";

interface Props {
  twiffaResult: TwiffaResult;
}

const logout = async () => {
  // XXX: typing
  const { data } = await axios.get("api/logout", {
    validateStatus: () => true,
  });

  if (data.type || data.description) {
    alert(`エラー: ${data.description || data.type}`);
  } else {
    window.location.reload();
  }
};

export const Component: FunctionComponent<Props> = ({ twiffaResult }) => {
  const [state, setState] = useState<{
    following?: string;
    followers?: string;
  }>({});

  useEffect(() => {
    (async () => {
      const [following, followers] = await Promise.all([
        toCsv(twiffaResult.following),
        toCsv(twiffaResult.followers),
      ]);

      setState({ followers, following });
    })();
  }, [twiffaResult]);

  return (
    <main className="w-full flex flex-col items-center">
      <div className="w-full flex flex-col md:flex-row justify-center items-center">
        <div className="w-8/12 md:w-4/12">
          <h2 className="text-2xl mb-2">フォロー</h2>
          <CsvDownloadButton filename="following.csv" data={state.following} />
          <UsersView data={state.following} />
        </div>
        <div className="w-8/12 md:w-4/12 mt-8 md:mt-0 md:ml-16">
          <h2 className="text-2xl mb-2">フォロワー</h2>
          <CsvDownloadButton filename="followers.csv" data={state.followers} />
          <UsersView data={state.followers} />
        </div>
      </div>

      <button className="mt-8" onClick={logout}>
        ログアウトする
      </button>
    </main>
  );
};

const toCsv = (users: TwitterUser[]): Promise<string> =>
  new Promise((resolve, reject) => {
    // NOTE: csv-stringify may have wrong type definition
    (stringify as unknown as typeof stringify.default)(
      users.map((u) => [u.id, u.username, u.name]),
      {
        columns: ["ID", "screen_name", "name"],
        header: true,
      },
      (err, output) => {
        if (err) reject(err);
        else resolve(output);
      }
    );
  });

const CsvDownloadButton: FunctionComponent<{
  filename: string;
  data?: string;
}> = ({ filename, data }) => {
  const download = () => {
    if (data === undefined) return;

    const URL = window.URL || window.webkitURL;

    const objectUrl = URL.createObjectURL(
      new Blob([data], { type: "text/csv" })
    );
    const a = document.createElement("a");

    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  return data === undefined ? (
    <></>
  ) : (
    <button className="m-2" onClick={download}>
      CSV をダウンロード
    </button>
  );
};

const UsersView: FunctionComponent<{
  data?: string;
}> = ({ data }) => {
  return (
    <div className="bg-white border h-80 p-4 overflow-auto whitespace-pre-line">
      {data}
    </div>
  );
};

export default Component;
